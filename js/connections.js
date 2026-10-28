/**
 * Dharashiv Foundation - Member Discovery & Connections Module
 */

import { getSupabase } from './supabase-client.js';
import { getCurrentProfile } from './auth.js';
import { mockStore } from './mock-store.js';
import { showToast, escapeHtml } from './ui.js';

export async function initConnectionsPage() {
  const currentProfile = await getCurrentProfile();
  await loadConnectionsData(currentProfile);
}

export async function initDiscoverPage() {
  const currentProfile = await getCurrentProfile();

  // Populate search query from URL if present
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  const searchInput = document.getElementById('memberSearchInput');
  if (searchInput && q) {
    searchInput.value = q;
  }

  // Setup filter triggers
  const filterInputs = [
    document.getElementById('memberSearchInput'),
    document.getElementById('filterTaluka'),
    document.getElementById('filterCategory'),
    document.getElementById('filterProfession')
  ];

  filterInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', () => filterMembers(currentProfile));
      input.addEventListener('change', () => filterMembers(currentProfile));
    }
  });

  await filterMembers(currentProfile);
}

export async function filterMembers(currentProfile) {
  const membersGrid = document.getElementById('membersGrid');
  if (!membersGrid) return;

  const searchQuery = document.getElementById('memberSearchInput')?.value.toLowerCase().trim() || '';
  const talukaFilter = document.getElementById('filterTaluka')?.value || '';
  const categoryFilter = document.getElementById('filterCategory')?.value || '';
  const professionFilter = document.getElementById('filterProfession')?.value || '';

  const supabase = await getSupabase();
  let members = [];
  let connections = [];

  if (supabase.isMock) {
    members = mockStore.getProfiles().filter(p => p.id !== currentProfile.id);
    connections = mockStore.getConnections(currentProfile.id);
  } else {
    const { data: profs } = await supabase.from('profiles').select('*').neq('id', currentProfile.id);
    const { data: conns } = await supabase.from('connections').select('*, requester:profiles!requester_id(*), recipient:profiles!recipient_id(*)')
      .or(`requester_id.eq.${currentProfile.id},recipient_id.eq.${currentProfile.id}`);
    members = profs || [];
    connections = conns || [];
  }

  // Apply filters
  const filtered = members.filter(m => {
    if (talukaFilter && m.taluka !== talukaFilter) return false;
    if (categoryFilter && m.business_category !== categoryFilter) return false;
    if (professionFilter && m.profession !== professionFilter) return false;

    if (searchQuery) {
      const matchName = m.full_name?.toLowerCase().includes(searchQuery);
      const matchComp = m.company_name?.toLowerCase().includes(searchQuery);
      const matchServ = m.services_offered?.toLowerCase().includes(searchQuery);
      const matchDesc = m.business_description?.toLowerCase().includes(searchQuery);
      if (!matchName && !matchComp && !matchServ && !matchDesc) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    membersGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <img src="/assets/illustrations/empty-connections.svg" class="empty-state-img" alt="No members" />
        <h3 class="empty-state-title">No Members Found</h3>
        <p class="empty-state-desc">Try clearing your filters or searching with a different term.</p>
      </div>
    `;
    return;
  }

  membersGrid.innerHTML = filtered.map(member => {
    // Find connection state
    const conn = connections.find(c =>
      (c.requester_id === currentProfile.id && c.recipient_id === member.id) ||
      (c.recipient_id === currentProfile.id && c.requester_id === member.id)
    );

    let statusText = 'Connect';
    let btnClass = 'btn-primary';
    let disabled = false;

    if (conn) {
      if (conn.status === 'accepted') {
        statusText = 'Connected';
        btnClass = 'btn-secondary';
      } else if (conn.status === 'pending') {
        statusText = conn.requester_id === currentProfile.id ? 'Requested' : 'Accept Request';
        btnClass = conn.requester_id === currentProfile.id ? 'btn-outline' : 'btn-success';
      }
    }

    return `
      <div class="member-card">
        <img src="${member.avatar_url || '/assets/avatars/default-avatar.svg'}" alt="${escapeHtml(member.full_name)}" class="member-card-avatar" />
        <h4 class="member-card-name">${escapeHtml(member.full_name)}</h4>
        <div class="member-card-title">${escapeHtml(member.profession || 'Community Member')}</div>
        <div class="member-card-company">${escapeHtml(member.company_name || 'Individual')}</div>
        <div class="member-card-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          ${escapeHtml(member.taluka || 'Dharashiv')}, Maharashtra
        </div>

        <div class="member-card-interests">
          ${(member.networking_interests || []).slice(0, 3).map(i => `
            <span class="interest-tag">${escapeHtml(i)}</span>
          `).join('')}
        </div>

        <div style="display: flex; gap: 0.5rem; width: 100%;">
          <a href="/profile.html?id=${member.id}" class="btn btn-sm btn-outline" style="flex: 1;">View</a>
          <button class="btn btn-sm ${btnClass} connect-action-btn"
                  data-member-id="${member.id}"
                  data-conn-id="${conn?.id || ''}"
                  data-status="${conn?.status || 'none'}"
                  style="flex: 1.2;">
            ${statusText}
          </button>
        </div>
      </div>
    `;
  }).join('');

  attachConnectionButtons(currentProfile);
}

function attachConnectionButtons(currentProfile) {
  document.querySelectorAll('.connect-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.memberId;
      const connId = btn.dataset.connId;
      const status = btn.dataset.status;

      btn.disabled = true;
      try {
        if (status === 'none') {
          // Send request
          await sendConnectionRequest(currentProfile.id, targetId);
          btn.textContent = 'Requested';
          btn.className = 'btn btn-sm btn-outline connect-action-btn';
          btn.dataset.status = 'pending';
          showToast('Connection request sent!', 'success');
        } else if (status === 'pending' && btn.textContent.includes('Accept')) {
          // Accept request
          await acceptConnectionRequest(connId);
          btn.textContent = 'Connected';
          btn.className = 'btn btn-sm btn-secondary connect-action-btn';
          btn.dataset.status = 'accepted';
          showToast('Connection request accepted!', 'success');
        }
      } catch (err) {
        showToast(err.message || 'Action failed.', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

async function sendConnectionRequest(requesterId, recipientId) {
  const supabase = await getSupabase();
  if (supabase.isMock) {
    mockStore.createConnection(requesterId, recipientId);
  } else {
    await supabase.from('connections').insert({
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending'
    });
  }
}

async function acceptConnectionRequest(connId) {
  const supabase = await getSupabase();
  if (supabase.isMock) {
    mockStore.updateConnectionStatus(connId, 'accepted');
  } else {
    await supabase.from('connections').update({ status: 'accepted' }).eq('id', connId);
  }
}

export async function loadConnectionsData(currentProfile) {
  const activeList = document.getElementById('activeConnectionsList');
  const requestsList = document.getElementById('pendingRequestsList');
  if (!activeList || !requestsList) return;

  const supabase = await getSupabase();
  let connections = [];

  if (supabase.isMock) {
    connections = mockStore.getConnections(currentProfile.id);
  } else {
    const { data } = await supabase.from('connections').select('*, requester:profiles!requester_id(*), recipient:profiles!recipient_id(*)')
      .or(`requester_id.eq.${currentProfile.id},recipient_id.eq.${currentProfile.id}`);
    connections = data || [];
  }

  const accepted = connections.filter(c => c.status === 'accepted');
  const pendingIncoming = connections.filter(c => c.status === 'pending' && c.recipient_id === currentProfile.id);

  // Render Incoming Requests
  if (pendingIncoming.length === 0) {
    requestsList.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; padding: 1rem 0;">No pending connection requests.</div>';
  } else {
    requestsList.innerHTML = pendingIncoming.map(c => {
      const sender = c.requester || (supabase.isMock ? mockStore.getProfile(c.requester_id) : null);
      return `
        <div class="card" style="padding: 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${sender?.avatar_url || '/assets/avatars/default-avatar.svg'}" class="table-user-avatar" alt="User" />
            <div>
              <div style="font-weight: 600; color: var(--color-primary-dark-brown);">${escapeHtml(sender?.full_name || 'Member')}</div>
              <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${escapeHtml(sender?.profession || 'Member')} • 📍 ${escapeHtml(sender?.taluka || 'Dharashiv')}</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-success accept-conn-btn" data-conn-id="${c.id}">Accept</button>
            <button class="btn btn-sm btn-outline reject-conn-btn" data-conn-id="${c.id}">Reject</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Accepted Connections
  if (accepted.length === 0) {
    activeList.innerHTML = `
      <div class="empty-state">
        <img src="/assets/illustrations/empty-connections.svg" class="empty-state-img" alt="No connections" />
        <h3 class="empty-state-title">No Active Connections Yet</h3>
        <p class="empty-state-desc">Discover fellow entrepreneurs and professionals across Dharashiv to grow your regional network.</p>
        <a href="/discover.html" class="btn btn-primary">Find Members</a>
      </div>
    `;
  } else {
    activeList.innerHTML = accepted.map(c => {
      const otherId = c.requester_id === currentProfile.id ? c.recipient_id : c.requester_id;
      const other = (c.requester_id === currentProfile.id ? c.recipient : c.requester) || (supabase.isMock ? mockStore.getProfile(otherId) : null);
      return `
        <div class="card" style="padding: 1.25rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <img src="${other?.avatar_url || '/assets/avatars/default-avatar.svg'}" style="width: 48px; height: 48px; border-radius: 9999px;" alt="User" />
            <div>
              <a href="/profile.html?id=${other?.id}" style="font-weight: 700; color: var(--color-primary-dark-brown); font-size: 1rem;">${escapeHtml(other?.full_name || 'Member')}</a>
              <div style="font-size: 0.8rem; color: var(--color-primary-rust);">${escapeHtml(other?.profession || 'Member')} • ${escapeHtml(other?.company_name || 'Individual')}</div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">📍 ${escapeHtml(other?.taluka || 'Dharashiv')}</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <a href="/messages.html?with=${other?.id}" class="btn btn-sm btn-primary">Message</a>
            <button class="btn btn-sm btn-outline remove-conn-btn" data-conn-id="${c.id}">Remove</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Attach accept/reject/remove events
  document.querySelectorAll('.accept-conn-btn').forEach(b => {
    b.addEventListener('click', async () => {
      await acceptConnectionRequest(b.dataset.connId);
      showToast('Connection accepted!', 'success');
      await loadConnectionsData(currentProfile);
    });
  });

  document.querySelectorAll('.reject-conn-btn, .remove-conn-btn').forEach(b => {
    b.addEventListener('click', async () => {
      if (confirm('Are you sure you want to remove this connection?')) {
        const supabase = await getSupabase();
        if (supabase.isMock) {
          mockStore.updateConnectionStatus(b.dataset.connId, 'rejected');
        } else {
          await supabase.from('connections').delete().eq('id', b.dataset.connId);
        }
        showToast('Connection removed.', 'info');
        await loadConnectionsData(currentProfile);
      }
    });
  });
}
