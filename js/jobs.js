/**
 * Dharashiv Foundation - Job Opportunities & Listings Module
 */

import { getSupabase } from './supabase-client.js';
import { getCurrentProfile } from './auth.js';
import { mockStore } from './mock-store.js';
import { formatRelativeTime, escapeHtml, showToast, openModal, closeModal } from './ui.js';

export async function initJobsPage() {
  const currentProfile = await getCurrentProfile();

  // Filter change handlers
  const filterInputs = [
    document.getElementById('jobSearchInput'),
    document.getElementById('filterJobTaluka'),
    document.getElementById('filterJobType'),
    document.getElementById('filterJobCategory')
  ];

  filterInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', () => loadJobsList(currentProfile));
      input.addEventListener('change', () => loadJobsList(currentProfile));
    }
  });

  // Post Job Modal trigger
  const openPostJobModalBtn = document.getElementById('openPostJobModalBtn');
  if (openPostJobModalBtn) {
    openPostJobModalBtn.addEventListener('click', () => {
      openModal('postJobModal');
    });
  }

  // Setup Post Job Form Submit
  const postJobForm = document.getElementById('postJobForm');
  if (postJobForm) {
    postJobForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleCreateJob(currentProfile);
    });
  }

  await loadJobsList(currentProfile);
}

export async function loadJobsList(currentProfile) {
  const container = document.getElementById('jobsListContainer');
  if (!container) return;

  const searchQuery = document.getElementById('jobSearchInput')?.value.toLowerCase().trim() || '';
  const talukaFilter = document.getElementById('filterJobTaluka')?.value || '';
  const typeFilter = document.getElementById('filterJobType')?.value || '';
  const categoryFilter = document.getElementById('filterJobCategory')?.value || '';

  const supabase = await getSupabase();
  let jobs = [];

  if (supabase.isMock) {
    jobs = mockStore.getJobs();
  } else {
    let query = supabase.from('jobs').select('*, poster:profiles(*)').order('created_at', { ascending: false });
    if (talukaFilter) query = query.eq('taluka', talukaFilter);
    if (typeFilter) query = query.eq('job_type', typeFilter);
    if (categoryFilter) query = query.eq('category', categoryFilter);

    const { data } = await query;
    jobs = data || [];
  }

  // Filter in mock mode or client search
  const filtered = jobs.filter(j => {
    if (talukaFilter && j.taluka !== talukaFilter) return false;
    if (typeFilter && j.job_type !== typeFilter) return false;
    if (categoryFilter && j.category !== categoryFilter) return false;

    if (searchQuery) {
      const matchTitle = j.title?.toLowerCase().includes(searchQuery);
      const matchComp = j.company_name?.toLowerCase().includes(searchQuery);
      const matchReq = j.requirements?.toLowerCase().includes(searchQuery);
      if (!matchTitle && !matchComp && !matchReq) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <img src="/assets/illustrations/empty-jobs.svg" class="empty-state-img" alt="No jobs" />
        <h3 class="empty-state-title">No Matching Opportunities</h3>
        <p class="empty-state-desc">Try clearing your search filters or be the first business to post an open vacancy in Dharashiv.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(job => `
    <div class="job-card">
      <div class="job-company-logo">
        ${job.company_name ? job.company_name.charAt(0).toUpperCase() : '💼'}
      </div>
      <div class="job-card-content">
        <div class="job-card-top">
          <div>
            <h3 class="job-title">
              <a href="/job-details.html?id=${job.id}">${escapeHtml(job.title)}</a>
            </h3>
            <div class="job-company-name">${escapeHtml(job.company_name)}</div>
          </div>
          <a href="/job-details.html?id=${job.id}" class="btn btn-sm btn-primary">View & Apply</a>
        </div>

        <div class="job-chips">
          <span class="job-chip">📍 ${escapeHtml(job.taluka || 'Dharashiv')}</span>
          <span class="job-chip">🕒 ${escapeHtml(job.job_type)}</span>
          <span class="job-chip">🏷️ ${escapeHtml(job.category)}</span>
          ${job.salary_range ? `<span class="job-chip">💰 ${escapeHtml(job.salary_range)}</span>` : ''}
        </div>

        <div class="job-description-excerpt">${escapeHtml(job.description.slice(0, 180))}...</div>

        <div class="job-card-footer">
          <span class="job-posted-time">Posted ${formatRelativeTime(job.created_at)}</span>
          <span class="badge badge-gray">${job.applications_count || 0} applicants</span>
        </div>
      </div>
    </div>
  `).join('');
}

async function handleCreateJob(currentProfile) {
  const submitBtn = document.getElementById('submitJobBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Posting...';
  }

  try {
    const title = document.getElementById('newJobTitle').value.trim();
    const company_name = document.getElementById('newJobCompany').value.trim();
    const taluka = document.getElementById('newJobTaluka').value;
    const location = document.getElementById('newJobLocation').value.trim();
    const job_type = document.getElementById('newJobType').value;
    const category = document.getElementById('newJobCategory').value;
    const salary_range = document.getElementById('newJobSalary').value.trim();
    const description = document.getElementById('newJobDesc').value.trim();
    const requirements = document.getElementById('newJobReqs').value.trim();

    const jobData = {
      title,
      company_name,
      taluka,
      location,
      job_type,
      category,
      salary_range,
      description,
      requirements
    };

    const supabase = await getSupabase();
    if (supabase.isMock) {
      mockStore.addJob(jobData);
    } else {
      await supabase.from('jobs').insert({
        ...jobData,
        poster_id: currentProfile.id
      });
    }

    closeModal('postJobModal');
    showToast('Job listing posted successfully!', 'success');
    document.getElementById('postJobForm').reset();
    await loadJobsList(currentProfile);

  } catch (err) {
    showToast(err.message || 'Failed to post job listing.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Post Vacancy';
    }
  }
}
