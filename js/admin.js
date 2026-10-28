/**
 * Dharashiv Foundation - Admin Portal Operations Module
 */

import { getSupabase } from './supabase-client.js';
import { requireAdmin } from './guards.js';
import { mockStore } from './mock-store.js';
import { formatDate, escapeHtml, showToast } from './ui.js';

export async function initAdminDashboard() {
  const auth = await requireAdmin();
  if (!auth) return;

  const currentProfile = auth.profile;

  // Load Admin Metrics
  await loadAdminStats();
  await loadRecentMembersTable();
}

export async function loadAdminStats() {
  const supabase = await getSupabase();

  let membersCount = 0;
  let activeJobsCount = 0;
  let postsCount = 0;
  let pendingReportsCount = 0;

  if (supabase.isMock) {
    membersCount = mockStore.getProfiles().length;
    activeJobsCount = mockStore.getJobs().filter(j => j.status === 'active').length;
    postsCount = mockStore.getPosts().length;
    pendingReportsCount = mockStore.getReports().filter(r => r.status === 'pending').length;
  } else {
    const { count: mc } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: jc } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: pc } = await supabase.from('posts').select('*', { count: 'exact', head: true });
    const { count: rc } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    membersCount = mc || 0;
    activeJobsCount = jc || 0;
    postsCount = pc || 0;
    pendingReportsCount = rc || 0;
  }

  const statMembers = document.getElementById('statTotalMembers');
  const statJobs = document.getElementById('statActiveJobs');
  const statPosts = document.getElementById('statTotalPosts');
  const statReports = document.getElementById('statPendingReports');

  if (statMembers) statMembers.textContent = membersCount;
  if (statJobs) statJobs.textContent = activeJobsCount;
  if (statPosts) statPosts.textContent = postsCount;
  if (statReports) statReports.textContent = pendingReportsCount;
}

export async function loadRecentMembersTable() {
  const container = document.getElementById('adminMembersTableBody');
  if (!container) return;

  const supabase = await getSupabase();
  let profiles = [];

  if (supabase.isMock) {
    profiles = mockStore.getProfiles();
  } else {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    profiles = data || [];
  }

  if (profiles.length === 0) {
    container.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">No registered members found.</td></tr>';
    return;
  }

  container.innerHTML = profiles.map(p => `
    <tr>
      <td>
        <div class="table-user-cell">
          <img src="${p.avatar_url || '/assets/avatars/default-avatar.svg'}" class="table-user-avatar" alt="Avatar" />
          <div class="table-user-info">
            <span class="table-user-name">${escapeHtml(p.full_name)}</span>
            <span class="table-user-email">${escapeHtml(p.email)}</span>
          </div>
        </div>
      </td>
      <td>${escapeHtml(p.taluka || 'Dharashiv')}</td>
      <td>${escapeHtml(p.profession || 'Member')}</td>
      <td>
        <span class="badge ${p.role === 'admin' ? 'badge-red' : 'badge-orange'}">${escapeHtml(p.role?.toUpperCase())}</span>
      </td>
      <td>
        <span class="badge ${p.is_active ? 'badge-green' : 'badge-gray'}">${p.is_active ? 'Active' : 'Disabled'}</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-outline toggle-status-btn" data-user-id="${p.id}" data-current="${p.is_active}">
            ${p.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.toggle-status-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid = btn.dataset.userId;
      const currentStatus = btn.dataset.current === 'true';
      const newStatus = !currentStatus;

      const supabase = await getSupabase();
      if (supabase.isMock) {
        mockStore.updateProfile(uid, { is_active: newStatus });
      } else {
        await supabase.from('profiles').update({ is_active: newStatus }).eq('id', uid);
      }

      showToast(`Member account ${newStatus ? 'activated' : 'deactivated'}.`, 'info');
      await loadRecentMembersTable();
    });
  });
}

export async function initModerationQueue() {
  const auth = await requireAdmin();
  if (!auth) return;

  const container = document.getElementById('moderationQueueContainer');
  if (!container) return;

  const supabase = await getSupabase();
  let reports = [];

  if (supabase.isMock) {
    reports = mockStore.getReports().filter(r => r.status === 'pending');
  } else {
    const { data } = await supabase.from('reports').select('*, reporter:profiles(*)').eq('status', 'pending');
    reports = data || [];
  }

  if (reports.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-state-title">Moderation Queue is Clean</h3>
        <p class="empty-state-desc">No flagged content or inappropriate reports pending administrator action.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reports.map(r => `
    <div class="moderation-item" id="report-${r.id}">
      <div class="moderation-header">
        <span class="report-reason">⚠️ Flagged: ${escapeHtml(r.reason)}</span>
        <span style="font-size: 0.75rem; color: var(--color-text-muted);">Report ID: ${r.id}</span>
      </div>

      <div style="font-size: 0.85rem; color: var(--color-text-secondary);">
        <strong>Report Details:</strong> ${escapeHtml(r.details || 'No additional comment provided.')}
      </div>

      <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
        <button class="btn btn-sm btn-danger resolve-delete-btn" data-report-id="${r.id}" data-target-id="${r.target_id}">
          Remove Content & Resolve
        </button>
        <button class="btn btn-sm btn-secondary dismiss-report-btn" data-report-id="${r.id}">
          Dismiss Report
        </button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.resolve-delete-btn').forEach(b => {
    b.addEventListener('click', async () => {
      const repId = b.dataset.reportId;
      const targetId = b.dataset.targetId;

      const supabase = await getSupabase();
      if (supabase.isMock) {
        mockStore.deletePost(targetId);
        const rep = mockStore.data.reports.find(r => r.id === repId);
        if (rep) rep.status = 'resolved';
        mockStore.save();
      } else {
        await supabase.from('posts').delete().eq('id', targetId);
        await supabase.from('reports').update({ status: 'resolved', action_taken: 'Content Deleted' }).eq('id', repId);
      }

      showToast('Content removed and report resolved.', 'success');
      document.getElementById(`report-${repId}`)?.remove();
    });
  });

  document.querySelectorAll('.dismiss-report-btn').forEach(b => {
    b.addEventListener('click', async () => {
      const repId = b.dataset.reportId;
      const supabase = await getSupabase();
      if (supabase.isMock) {
        const rep = mockStore.data.reports.find(r => r.id === repId);
        if (rep) rep.status = 'dismissed';
        mockStore.save();
      } else {
        await supabase.from('reports').update({ status: 'dismissed' }).eq('id', repId);
      }
      showToast('Report dismissed.', 'info');
      document.getElementById(`report-${repId}`)?.remove();
    });
  });
}
