/**
 * Dharashiv Foundation - Route & Authorization Guards
 * Enforces server-side validated session and role protection.
 * Never trusts frontend variables alone.
 */

import { getSession, getCurrentProfile } from './auth.js';

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login.html?returnUrl=${returnUrl}`;
    return null;
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    // Session exists but profile row missing -> send to registration
    if (!window.location.pathname.includes('register.html')) {
      window.location.href = '/register.html';
      return null;
    }
  } else if (!profile.is_profile_completed && !window.location.pathname.includes('register.html')) {
    window.location.href = '/register.html';
    return null;
  }

  return { session, profile };
}

export async function requireAdmin() {
  const authData = await requireAuth();
  if (!authData) return null;

  const { profile } = authData;
  if (!profile || profile.role !== 'admin') {
    alert('Access Denied: You do not possess Administrator privileges for the Dharashiv Foundation platform.');
    window.location.href = '/dashboard.html';
    return null;
  }

  return authData;
}

export async function redirectIfAuthenticated() {
  const session = await getSession();
  if (session) {
    const profile = await getCurrentProfile();
    if (profile && !profile.is_profile_completed) {
      window.location.href = '/register.html';
    } else {
      window.location.href = '/dashboard.html';
    }
    return true;
  }
  return false;
}
