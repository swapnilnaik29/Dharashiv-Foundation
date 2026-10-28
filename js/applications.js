/**
 * Dharashiv Foundation - Job Application & Resume Handler
 * Securely uploads candidate resumes to AWS S3 and enforces authorized download.
 */

import { getSupabase } from './supabase-client.js';
import { getCurrentProfile } from './auth.js';
import { mockStore } from './mock-store.js';
import { uploadFileToS3, getAuthorizedDownloadUrl } from './uploads.js';
import { showToast, formatDate, escapeHtml, openModal, closeModal } from './ui.js';

let selectedResumeFile = null;

export async function initJobDetailsPage() {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('id');

  if (!jobId) {
    window.location.href = '/jobs.html';
    return;
  }

  const currentProfile = await getCurrentProfile();
  const supabase = await getSupabase();

  let job = null;
  if (supabase.isMock) {
    job = mockStore.getJobs().find(j => j.id === jobId);
  } else {
    const { data } = await supabase.from('jobs').select('*, poster:profiles(*)').eq('id', jobId).single();
    job = data;
  }

  if (!job) {
    document.getElementById('jobDetailsContent').innerHTML = `
      <div class="empty-state">
        <h3 class="empty-state-title">Job Not Found</h3>
        <p class="empty-state-desc">This job listing may have expired or been removed by the employer.</p>
        <a href="/jobs.html" class="btn btn-primary">Back to Jobs</a>
      </div>
    `;
    return;
  }

  renderJobDetails(job, currentProfile);
  setupApplicationModal(job, currentProfile);
}

function renderJobDetails(job, currentProfile) {
  const container = document.getElementById('jobDetailsContent');
  if (!container) return;

  const isPoster = currentProfile?.id === job.poster_id;

  container.innerHTML = `
    <div class="card" style="margin-bottom: 2rem;">
      <div class="card-body">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap;">
          <div>
            <span class="badge badge-orange" style="margin-bottom: 0.5rem;">${escapeHtml(job.category)}</span>
            <h1 style="font-size: 1.75rem; font-weight: 800; color: var(--color-primary-dark-brown); margin-bottom: 0.25rem;">${escapeHtml(job.title)}</h1>
            <div style="font-size: 1.1rem; color: var(--color-primary-rust); font-weight: 600;">${escapeHtml(job.company_name)}</div>
            <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0.25rem;">
              📍 ${escapeHtml(job.location)}, ${escapeHtml(job.taluka)} Taluka • Posted on ${formatDate(job.created_at)}
            </div>
          </div>

          <div>
            ${isPoster ? `
              <a href="/applications.html?tab=received" class="btn btn-secondary">Review Applicants (${job.applications_count || 0})</a>
            ` : `
              <button class="btn btn-primary btn-lg" id="applyJobModalBtn">Apply for this Role</button>
            `}
          </div>
        </div>

        <div class="job-chips" style="margin-top: 1.5rem; padding: 1rem 0; border-top: 1px solid var(--color-border-light); border-bottom: 1px solid var(--color-border-light);">
          <span class="job-chip">🕒 <strong>Job Type:</strong> ${escapeHtml(job.job_type)}</span>
          <span class="job-chip">💰 <strong>Salary:</strong> ${escapeHtml(job.salary_range || 'Competitive')}</span>
          <span class="job-chip">📍 <strong>Taluka:</strong> ${escapeHtml(job.taluka)}</span>
          <span class="job-chip">🛡️ <strong>S3 Protected Resumes</strong></span>
        </div>

        <div style="margin-top: 2rem;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-dark-brown); margin-bottom: 0.75rem;">Job Description</h3>
          <p style="font-size: 0.95rem; line-height: 1.7; color: var(--color-text-primary); white-space: pre-line;">${escapeHtml(job.description)}</p>
        </div>

        <div style="margin-top: 2rem;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-dark-brown); margin-bottom: 0.75rem;">Requirements & Candidate Qualifications</h3>
          <p style="font-size: 0.95rem; line-height: 1.7; color: var(--color-text-primary); white-space: pre-line;">${escapeHtml(job.requirements)}</p>
        </div>
      </div>
    </div>
  `;

  const applyBtn = document.getElementById('applyJobModalBtn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => openModal('applyJobModal'));
  }
}

function setupApplicationModal(job, currentProfile) {
  const dropzone = document.getElementById('resumeDropzone');
  const fileInput = document.getElementById('resumeFileInput');
  const selectedBadge = document.getElementById('selectedFileBadge');
  const selectedFileName = document.getElementById('selectedFileName');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedResumeFile = file;
        selectedFileName.textContent = file.name;
        selectedBadge.style.display = 'inline-flex';
      }
    });
  }

  const applyForm = document.getElementById('applyJobForm');
  if (applyForm) {
    applyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedResumeFile) {
        showToast('Please select your resume file (PDF or DOCX).', 'error');
        return;
      }

      const submitBtn = document.getElementById('submitApplicationBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Uploading Resume to S3...';

      try {
        // 1. Upload to S3
        const uploadRes = await uploadFileToS3({
          file: selectedResumeFile,
          uploadType: 'resume'
        });

        const coverLetter = document.getElementById('applicantCoverLetter').value.trim();

        submitBtn.innerHTML = 'Submitting Application...';

        // 2. Submit application record
        const supabase = await getSupabase();
        if (supabase.isMock) {
          mockStore.addApplication({
            job_id: job.id,
            resume_s3_key: uploadRes.objectKey,
            resume_filename: uploadRes.filename,
            cover_letter: coverLetter
          });
        } else {
          await supabase.from('job_applications').insert({
            job_id: job.id,
            applicant_id: currentProfile.id,
            resume_s3_key: uploadRes.objectKey,
            resume_filename: uploadRes.filename,
            cover_letter: coverLetter
          });
        }

        closeModal('applyJobModal');
        showToast('Application and resume submitted successfully!', 'success');
        setTimeout(() => {
          window.location.href = '/applications.html';
        }, 1200);

      } catch (err) {
        console.error('Application submit failed:', err);
        showToast(err.message || 'Failed to submit application.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Application';
      }
    });
  }
}

export async function initApplicationsPage() {
  const currentProfile = await getCurrentProfile();
  await loadMyApplications(currentProfile);
  await loadReceivedApplications(currentProfile);

  // Tab switching
  const tabCandidates = document.getElementById('tabCandidateApps');
  const tabEmployer = document.getElementById('tabEmployerApps');
  const sectionCandidate = document.getElementById('candidateAppsSection');
  const sectionEmployer = document.getElementById('employerAppsSection');

  if (tabCandidates && tabEmployer && sectionCandidate && sectionEmployer) {
    tabCandidates.addEventListener('click', () => {
      tabCandidates.classList.add('active');
      tabEmployer.classList.remove('active');
      sectionCandidate.style.display = 'block';
      sectionEmployer.style.display = 'none';
    });

    tabEmployer.addEventListener('click', () => {
      tabEmployer.classList.add('active');
      tabCandidates.classList.remove('active');
      sectionEmployer.style.display = 'block';
      sectionCandidate.style.display = 'none';
    });

    // Check URL param ?tab=received
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'received') {
      tabEmployer.click();
    }
  }
}

async function loadMyApplications(currentProfile) {
  const container = document.getElementById('myApplicationsList');
  if (!container) return;

  const supabase = await getSupabase();
  let apps = [];

  if (supabase.isMock) {
    apps = mockStore.getApplications(null, currentProfile.id);
  } else {
    const { data } = await supabase
      .from('job_applications')
      .select('*, job:jobs(*)')
      .eq('applicant_id', currentProfile.id)
      .order('created_at', { ascending: false });
    apps = data || [];
  }

  if (apps.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <img src="/assets/illustrations/empty-jobs.svg" class="empty-state-img" alt="No apps" />
        <h3 class="empty-state-title">No Applications Submitted</h3>
        <p class="empty-state-desc">Explore regional job opportunities posted by businesses across Dharashiv.</p>
        <a href="/jobs.html" class="btn btn-primary">Browse Jobs</a>
      </div>
    `;
    return;
  }

  container.innerHTML = apps.map(a => `
    <div class="card" style="padding: 1.25rem 1.5rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--color-primary-dark-brown); margin-bottom: 0.25rem;">
          <a href="/job-details.html?id=${a.job?.id}">${escapeHtml(a.job?.title || 'Job Opportunity')}</a>
        </h4>
        <div style="font-size: 0.85rem; color: var(--color-primary-rust); font-weight: 600;">${escapeHtml(a.job?.company_name || 'Organization')} • 📍 ${escapeHtml(a.job?.taluka || 'Dharashiv')}</div>
        <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.35rem;">Submitted on ${formatDate(a.created_at)} • File: <code>${escapeHtml(a.resume_filename)}</code></div>
      </div>

      <div style="display: flex; align-items: center; gap: 1rem;">
        <span class="badge ${a.status === 'shortlisted' ? 'badge-green' : a.status === 'rejected' ? 'badge-red' : 'badge-orange'}">
          ${escapeHtml(a.status?.replace('_', ' ').toUpperCase())}
        </span>
      </div>
    </div>
  `).join('');
}

async function loadReceivedApplications(currentProfile) {
  const container = document.getElementById('receivedApplicationsList');
  if (!container) return;

  const supabase = await getSupabase();
  let apps = [];

  if (supabase.isMock) {
    // Return all apps where job.poster_id === currentProfile.id (or all for admin)
    apps = mockStore.data.job_applications.map(a => {
      const job = mockStore.data.jobs.find(j => j.id === a.job_id);
      const applicant = mockStore.getProfile(a.applicant_id);
      return { ...a, job, applicant };
    });
  } else {
    const { data } = await supabase
      .from('job_applications')
      .select('*, job:jobs!inner(poster_id, title), applicant:profiles(*)')
      .eq('job.poster_id', currentProfile.id)
      .order('created_at', { ascending: false });
    apps = data || [];
  }

  if (apps.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-state-title">No Candidate Applications Yet</h3>
        <p class="empty-state-desc">When candidates apply for your posted vacancies, their applications and private S3 resumes will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = apps.map(a => `
    <div class="card" style="padding: 1.5rem; margin-bottom: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
        <div style="display: flex; gap: 1rem; align-items: center;">
          <img src="${a.applicant?.avatar_url || '/assets/avatars/default-avatar.svg'}" style="width: 50px; height: 50px; border-radius: 9999px;" alt="Avatar" />
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--color-primary-dark-brown);">${escapeHtml(a.applicant?.full_name || 'Candidate')}</h4>
            <div style="font-size: 0.85rem; color: var(--color-text-secondary);">${escapeHtml(a.applicant?.profession || 'Professional')} • 📍 ${escapeHtml(a.applicant?.taluka || 'Dharashiv')}</div>
            <div style="font-size: 0.8rem; color: var(--color-primary-rust); font-weight: 600; margin-top: 0.2rem;">Role applied: ${escapeHtml(a.job?.title || 'Open Vacancy')}</div>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="btn btn-sm btn-primary download-resume-btn"
                  data-app-id="${a.id}"
                  data-s3-key="${a.resume_s3_key}"
                  data-filename="${a.resume_filename}">
            📄 Download Resume (S3)
          </button>
        </div>
      </div>

      ${a.cover_letter ? `
        <div style="margin-top: 1rem; padding: 0.85rem 1rem; background: var(--color-warm-bg); border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--color-text-primary); border: 1px solid var(--color-border-light);">
          <strong>Cover Letter:</strong> ${escapeHtml(a.cover_letter)}
        </div>
      ` : ''}
    </div>
  `).join('');

  // Attach resume download click
  document.querySelectorAll('.download-resume-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Generating Secure S3 URL...';
      try {
        const downloadUrl = await getAuthorizedDownloadUrl({
          applicationId: btn.dataset.appId,
          s3Key: btn.dataset.s3Key,
          filename: btn.dataset.filename
        });

        // Trigger browser download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = btn.dataset.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        showToast('Secure download initiated via short-lived AWS S3 URL.', 'success');
      } catch (err) {
        showToast(err.message || 'Download failed.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '📄 Download Resume (S3)';
      }
    });
  });
}
