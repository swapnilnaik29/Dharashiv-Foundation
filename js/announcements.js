/**
 * Dharashiv Foundation - Announcements Module
 */

import { getSupabase } from './supabase-client.js';
import { getCurrentProfile } from './auth.js';
import { mockStore } from './mock-store.js';
import { formatDate, escapeHtml, showToast, openModal, closeModal } from './ui.js';

export async function initAnnouncementsPage() {
  const currentProfile = await getCurrentProfile();

  const openModalBtn = document.getElementById('openSubmitAnnouncementBtn');
  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => openModal('submitAnnouncementModal'));
  }

  const form = document.getElementById('submitAnnouncementForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSubmitAnnouncement(currentProfile);
    });
  }

  await loadAnnouncementsList(currentProfile);
}

export async function loadAnnouncementsList(currentProfile) {
  const container = document.getElementById('announcementsListContainer');
  if (!container) return;

  const supabase = await getSupabase();
  let items = [];

  if (supabase.isMock) {
    items = mockStore.getAnnouncements();
  } else {
    const { data } = await supabase.from('announcements').select('*, author:profiles(*)').order('created_at', { ascending: false });
    items = data || [];
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-state-title">No Announcements Published</h3>
        <p class="empty-state-desc">Official community notices and updates will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(ann => `
    <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid ${ann.is_official ? 'var(--color-primary-orange)' : 'var(--color-primary-rust)'};">
      <div class="card-body">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
          <div>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
              ${ann.is_official ? '<span class="badge badge-orange">Official Dharashiv Foundation</span>' : '<span class="badge badge-gray">Community Notice</span>'}
              <span class="badge ${ann.priority === 'high' ? 'badge-red' : 'badge-gray'}">${escapeHtml(ann.priority?.toUpperCase())} PRIORITY</span>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary-dark-brown);">${escapeHtml(ann.title)}</h3>
            <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.25rem;">
              Published on ${formatDate(ann.created_at)} by ${escapeHtml(ann.author?.full_name || 'Foundation Admin')}
            </div>
          </div>
        </div>

        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--color-text-primary); margin-top: 1rem; white-space: pre-line;">
          ${escapeHtml(ann.content)}
        </p>
      </div>
    </div>
  `).join('');
}

async function handleSubmitAnnouncement(currentProfile) {
  const submitBtn = document.getElementById('submitAnnBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Submitting...'; }

  try {
    const title = document.getElementById('annTitle').value.trim();
    const content = document.getElementById('annContent').value.trim();
    const priority = document.getElementById('annPriority').value;
    const isOfficial = currentProfile.role === 'admin';
    const status = isOfficial ? 'approved' : 'pending';

    const supabase = await getSupabase();
    if (supabase.isMock) {
      mockStore.data.announcements.unshift({
        id: 'ann-' + Date.now(),
        author_id: currentProfile.id,
        title,
        content,
        priority,
        status,
        is_official: isOfficial,
        created_at: new Date().toISOString()
      });
      mockStore.save();
    } else {
      await supabase.from('announcements').insert({
        author_id: currentProfile.id,
        title,
        content,
        priority,
        status,
        is_official: isOfficial
      });
    }

    closeModal('submitAnnouncementModal');
    showToast(isOfficial ? 'Announcement published!' : 'Announcement submitted for admin approval.', 'success');
    document.getElementById('submitAnnouncementForm').reset();
    await loadAnnouncementsList(currentProfile);

  } catch (err) {
    showToast(err.message || 'Failed to submit announcement.', 'error');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Submit Announcement'; }
  }
}
