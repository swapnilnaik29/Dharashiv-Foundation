/**
 * Dharashiv Foundation - App Navigation & Header Component
 */

import { signOut, getCurrentProfile } from './auth.js';
import { getSupabase } from './supabase-client.js';
import { mockStore } from './mock-store.js';

export async function initNavigation(activeKey = '') {
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === 'admin';

  let unreadCount = 0;
  if (profile?.id) {
    try {
      const supabase = await getSupabase();
      if (supabase.isMock) {
        unreadCount = mockStore.getNotifications(profile.id).filter(n => !n.is_read).length;
      } else {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', profile.id)
          .eq('is_read', false);
        unreadCount = count || 0;
      }
    } catch (e) {
      console.warn('Could not fetch unread notifications count:', e);
    }
  }

  // Render Sidebar
  renderSidebar(profile, isAdmin, activeKey, unreadCount);

  // Render Header
  renderHeader(profile, unreadCount);

  // Attach event listeners
  setupNavigationEvents();
}

function renderSidebar(profile, isAdmin, activeKey, unreadNotifs = 0) {
  const sidebarContainer = document.getElementById('sidebarContainer');
  if (!sidebarContainer) return;

  sidebarContainer.innerHTML = `
    <aside class="app-sidebar" id="appSidebar">
      <div class="sidebar-header">
        <a href="/dashboard.html" class="sidebar-brand">
          <img src="/assets/logos/logo-compact.svg" alt="Dharashiv Foundation" />
          <div class="sidebar-brand-text">
            <span class="sidebar-brand-title">DHARASHIV</span>
            <span class="sidebar-brand-sub">Foundation Network</span>
          </div>
        </a>
      </div>

      <nav class="sidebar-nav">
        <span class="nav-section-title">Community</span>
        <a href="/dashboard.html" class="nav-link ${activeKey === 'dashboard' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard
        </a>
        <a href="/feed.html" class="nav-link ${activeKey === 'feed' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle>
          </svg>
          Social Feed
        </a>
        <a href="/discover.html" class="nav-link ${activeKey === 'discover' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Discover Members
        </a>
        <a href="/connections.html" class="nav-link ${activeKey === 'connections' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          My Connections
        </a>
        <a href="/messages.html" class="nav-link ${activeKey === 'messages' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Messages
        </a>

        <span class="nav-section-title">Opportunities</span>
        <a href="/jobs.html" class="nav-link ${activeKey === 'jobs' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          Job Board
        </a>
        <a href="/applications.html" class="nav-link ${activeKey === 'applications' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          My Applications
        </a>
        <a href="/events.html" class="nav-link ${activeKey === 'events' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Events
        </a>
        <a href="/announcements.html" class="nav-link ${activeKey === 'announcements' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          Announcements
        </a>

        ${isAdmin ? `
          <span class="nav-section-title">Administration</span>
          <a href="/admin/index.html" class="nav-link ${activeKey.startsWith('admin') ? 'active' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Admin Portal
            <span class="nav-badge" style="background: var(--color-error); color: white;">Admin</span>
          </a>
        ` : ''}

        <span class="nav-section-title">Account</span>
        <a href="/notifications.html" class="nav-link ${activeKey === 'notifications' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          Notifications
          ${unreadNotifs > 0 ? `<span class="nav-badge">${unreadNotifs}</span>` : ''}
        </a>
        <a href="/settings.html" class="nav-link ${activeKey === 'settings' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Settings
        </a>
      </nav>

      <div class="sidebar-footer">
        <a href="/profile.html" class="user-mini-profile">
          <img src="${profile?.avatar_url || '/assets/avatars/default-avatar.svg'}" alt="${profile?.full_name || 'User'}" class="user-mini-avatar" />
          <div class="user-mini-info">
            <div class="user-mini-name">${profile?.full_name || 'Member'}</div>
            <div class="user-mini-role">${profile?.role || 'Member'} • ${profile?.taluka || 'Dharashiv'}</div>
          </div>
        </a>
      </div>
    </aside>
    <div class="drawer-backdrop" id="drawerBackdrop"></div>
  `;
}

function renderHeader(profile, unreadCount = 0) {
  const headerContainer = document.getElementById('headerContainer');
  if (!headerContainer) return;

  const currentPath = window.location.pathname;
  let pageTitle = 'Dashboard';
  if (currentPath.includes('feed')) pageTitle = 'Community Feed';
  else if (currentPath.includes('discover')) pageTitle = 'Discover Members';
  else if (currentPath.includes('connections')) pageTitle = 'My Connections';
  else if (currentPath.includes('messages')) pageTitle = 'Direct Messages';
  else if (currentPath.includes('jobs')) pageTitle = 'Job Opportunities';
  else if (currentPath.includes('applications')) pageTitle = 'Job Applications';
  else if (currentPath.includes('events')) pageTitle = 'Community Events';
  else if (currentPath.includes('announcements')) pageTitle = 'Announcements';
  else if (currentPath.includes('notifications')) pageTitle = 'Notifications';
  else if (currentPath.includes('profile')) pageTitle = 'Member Profile';
  else if (currentPath.includes('settings')) pageTitle = 'Account Settings';
  else if (currentPath.includes('admin')) pageTitle = 'Admin Management';

  headerContainer.innerHTML = `
    <header class="app-header">
      <div class="header-left">
        <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Open menu">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div class="breadcrumbs">
          <span>Dharashiv</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">${pageTitle}</span>
        </div>
      </div>

      <div class="header-search">
        <svg class="header-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="globalSearchInput" placeholder="Search members, jobs, businesses..." />
      </div>

      <div class="header-right">
        <a href="/notifications.html" class="header-btn" title="Notifications">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          ${unreadCount > 0 ? `<span class="header-badge">${unreadCount}</span>` : ''}
        </a>

        <div class="user-dropdown">
          <button class="user-profile-trigger" id="userMenuBtn" aria-expanded="false">
            <img src="${profile?.avatar_url || '/assets/avatars/default-avatar.svg'}" alt="${profile?.full_name || 'User'}" class="user-profile-avatar" />
            <span class="user-profile-name">${profile?.full_name?.split(' ')[0] || 'User'}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <div class="dropdown-menu" id="userDropdownMenu">
            <a href="/profile.html" class="dropdown-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              My Profile
            </a>
            <a href="/settings.html" class="dropdown-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              Account Settings
            </a>
            <div class="dropdown-divider"></div>
            <button id="logoutBtn" class="dropdown-item danger" style="width: 100%; border: none; background: none; text-align: left; cursor: pointer;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}

function setupNavigationEvents() {
  // Mobile drawer toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('drawerBackdrop');

  if (mobileMenuBtn && sidebar && backdrop) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
    });
  }

  // User menu dropdown toggle
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdownMenu = document.getElementById('userDropdownMenu');

  if (userMenuBtn && userDropdownMenu) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      userDropdownMenu.classList.remove('show');
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to sign out of Dharashiv Foundation?')) {
        await signOut();
      }
    });
  }

  // Global search input enter key
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        window.location.href = `/discover.html?q=${encodeURIComponent(searchInput.value.trim())}`;
      }
    });
  }
}
