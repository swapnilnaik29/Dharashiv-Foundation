/**
 * Dharashiv Foundation - Notifications Module
 */

import { getSupabase } from './supabase-client.js';
import { getCurrentProfile } from './auth.js';
import { mockStore } from './mock-store.js';
import { formatRelativeTime, escapeHtml, showToast } from './ui.js';

export async function initNotificationsPage() {
  const currentProfile = await getCurrentProfile();

  const markAllBtn = document.getElementById('markAllReadBtn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      const supabase = await getSupabase();
      if (supabase.isMock) {
        mockStore.markAllNotificationsRead(currentProfile.id);
      } else {
        await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', currentProfile.id);
      }
      showToast('All notifications marked as read.', 'success');
      await loadNotifications(currentProfile);
    });
  }

  await loadNotifications(currentProfile);
}

export async function loadNotifications(currentProfile) {
  const container = document.getElementById('notificationsListContainer');
  if (!container) return;

  const supabase = await getSupabase();
  let notifications = [];

  if (supabase.isMock) {
    notifications = mockStore.getNotifications(currentProfile.id);
  } else {
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles(*)')
      .eq('recipient_id', currentProfile.id)
      .order('created_at', { ascending: false });
    notifications = data || [];
  }

  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <img src="/assets/illustrations/empty-notifications.svg" class="empty-state-img" alt="All caught up" />
        <h3 class="empty-state-title">You're All Caught Up!</h3>
        <p class="empty-state-desc">No new notifications. When members connect, comment, or message you, updates will arrive here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notifications.map(n => {
    return `
      <div class="card" style="padding: 1.25rem; margin-bottom: 0.85rem; background: ${n.is_read ? 'var(--color-surface)' : 'var(--color-light-orange)'}; border-left: 4px solid ${n.is_read ? 'var(--color-border)' : 'var(--color-primary-orange)'}; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 40px; height: 40px; border-radius: 9999px; background: rgba(255,122,24,0.15); color: var(--color-primary-orange); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
            🔔
          </div>
          <div>
            <div style="font-weight: 700; color: var(--color-primary-dark-brown); font-size: 0.95rem;">${escapeHtml(n.title)}</div>
            <div style="font-size: 0.85rem; color: var(--color-text-primary); margin-top: 0.2rem;">${escapeHtml(n.message)}</div>
            <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 0.35rem;">${formatRelativeTime(n.created_at)}</div>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
          ${n.link_url ? `<a href="${n.link_url}" class="btn btn-sm btn-outline">View</a>` : ''}
          ${!n.is_read ? `<button class="btn btn-sm btn-secondary mark-read-btn" data-notif-id="${n.id}">Mark Read</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.mark-read-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const notifId = btn.dataset.notifId;
      const supabase = await getSupabase();
      if (supabase.isMock) {
        mockStore.markNotificationRead(notifId);
      } else {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
      }
      await loadNotifications(currentProfile);
    });
  });
}
