/**
 * Dharashiv Foundation - Profile View & Edit Module
 */

import { getSupabase } from './supabase-client.js';
import { getCurrentProfile } from './auth.js';
import { mockStore } from './mock-store.js';
import { escapeHtml, showToast, openModal, closeModal } from './ui.js';

export async function initProfilePage() {
  const currentProfile = await getCurrentProfile();
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('id') || currentProfile?.id;

  const supabase = await getSupabase();
  let profile = null;

  if (supabase.isMock) {
    profile = mockStore.getProfile(targetId);
  } else {
    const { data } = await supabase.from('profiles').select('*').eq('id', targetId).single();
    profile = data;
  }

  if (!profile) {
    document.getElementById('profileContentContainer').innerHTML = `
      <div class="empty-state">
        <h3 class="empty-state-title">Profile Not Found</h3>
        <p class="empty-state-desc">The member profile you requested could not be located.</p>
        <a href="/discover.html" class="btn btn-primary">Discover Members</a>
      </div>
    `;
    return;
  }

  const isOwnProfile = currentProfile?.id === profile.id;
  renderProfile(profile, isOwnProfile);

  if (isOwnProfile) {
    setupEditProfileModal(profile);
  }
}

function renderProfile(profile, isOwnProfile) {
  const container = document.getElementById('profileContentContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="profile-header-card">
      <div class="profile-cover"></div>
      <div class="profile-header-body">
        <div class="profile-avatar-row">
          <img src="${profile.avatar_url || '/assets/avatars/default-avatar.svg'}" class="profile-main-avatar" alt="${escapeHtml(profile.full_name)}" />
          <div class="profile-header-actions">
            ${isOwnProfile ? `
              <button class="btn btn-outline" id="openEditProfileBtn">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit Profile
              </button>
            ` : `
              <a href="/messages.html?with=${profile.id}" class="btn btn-primary">Send Message</a>
            `}
          </div>
        </div>

        <div class="profile-name-row">
          <h1 class="profile-full-name">${escapeHtml(profile.full_name)}</h1>
          <div class="profile-headline">${escapeHtml(profile.profession || 'Community Member')} ${profile.company_name ? 'at ' + escapeHtml(profile.company_name) : ''}</div>
          <div class="profile-meta-chips">
            <span class="meta-chip">📍 Native Village: ${escapeHtml(profile.native_village || 'Dharashiv')}</span>
            <span class="meta-chip">🏛️ Taluka: ${escapeHtml(profile.taluka || 'Dharashiv')}</span>
            <span class="meta-chip">🏢 Current City: ${escapeHtml(profile.current_city || 'Dharashiv')}</span>
            <span class="badge ${profile.role === 'admin' ? 'badge-red' : 'badge-orange'}">${profile.role?.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-grid">
      <div>
        <!-- Business Details -->
        <div class="profile-section-card">
          <h3 class="section-heading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            Business & Professional Details
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Organization</span>
              <span class="info-val">${escapeHtml(profile.company_name || 'Individual / Independent')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Category</span>
              <span class="info-val">${escapeHtml(profile.business_category || 'General')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Business Type</span>
              <span class="info-val">${escapeHtml(profile.business_type || 'Enterprise')}</span>
            </div>
          </div>

          ${profile.business_description ? `
            <div style="margin-top: 1.25rem;">
              <span class="info-label">About Enterprise</span>
              <p style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-primary); margin-top: 0.25rem;">${escapeHtml(profile.business_description)}</p>
            </div>
          ` : ''}

          ${profile.services_offered ? `
            <div style="margin-top: 1.25rem;">
              <span class="info-label">Services / Products Offered</span>
              <p style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-primary); margin-top: 0.25rem;">${escapeHtml(profile.services_offered)}</p>
            </div>
          ` : ''}
        </div>

        <!-- Networking Interests -->
        <div class="profile-section-card">
          <h3 class="section-heading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            Networking Interests & Collaboration Goals
          </h3>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
            ${(profile.networking_interests || ['Regional Growth', 'Community Collaboration']).map(i => `
              <span class="interest-tag" style="padding: 0.35rem 0.85rem; font-size: 0.8rem;">${escapeHtml(i)}</span>
            `).join('')}
          </div>
        </div>
      </div>

      <div>
        <!-- Contact & Links -->
        <div class="profile-section-card">
          <h3 class="section-heading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Verified Contact & Links
          </h3>
          <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.9rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--color-text-secondary);">
              <span>📧</span>
              <span>${escapeHtml(profile.email)}</span>
            </div>
            ${profile.website_url ? `
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>🌐</span>
                <a href="${escapeHtml(profile.website_url)}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-orange); text-decoration: underline;">${escapeHtml(profile.website_url)}</a>
              </div>
            ` : ''}
            ${profile.linkedin_url ? `
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>🔗</span>
                <a href="${escapeHtml(profile.linkedin_url)}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-rust); text-decoration: underline;">LinkedIn Profile</a>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  const editBtn = document.getElementById('openEditProfileBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => openModal('editProfileModal'));
  }
}

function setupEditProfileModal(profile) {
  const form = document.getElementById('editProfileForm');
  if (!form) return;

  // Pre-fill
  document.getElementById('editFullName').value = profile.full_name || '';
  document.getElementById('editVillage').value = profile.native_village || '';
  document.getElementById('editTaluka').value = profile.taluka || 'Dharashiv';
  document.getElementById('editCity').value = profile.current_city || '';
  document.getElementById('editCompany').value = profile.company_name || '';
  document.getElementById('editCategory').value = profile.business_category || '';
  document.getElementById('editDesc').value = profile.business_description || '';
  document.getElementById('editServices').value = profile.services_offered || '';
  document.getElementById('editWebsite').value = profile.website_url || '';
  document.getElementById('editLinkedIn').value = profile.linkedin_url || '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updates = {
      full_name: document.getElementById('editFullName').value.trim(),
      native_village: document.getElementById('editVillage').value.trim(),
      taluka: document.getElementById('editTaluka').value,
      current_city: document.getElementById('editCity').value.trim(),
      company_name: document.getElementById('editCompany').value.trim(),
      business_category: document.getElementById('editCategory').value,
      business_description: document.getElementById('editDesc').value.trim(),
      services_offered: document.getElementById('editServices').value.trim(),
      website_url: document.getElementById('editWebsite').value.trim(),
      linkedin_url: document.getElementById('editLinkedIn').value.trim()
    };

    const supabase = await getSupabase();
    if (supabase.isMock) {
      mockStore.updateProfile(profile.id, updates);
    } else {
      await supabase.from('profiles').update(updates).eq('id', profile.id);
    }

    closeModal('editProfileModal');
    showToast('Profile updated successfully!', 'success');
    await initProfilePage();
  });
}
