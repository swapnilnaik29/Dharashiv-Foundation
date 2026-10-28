/**
 * Dharashiv Foundation - Authentication Module
 * Official Google OAuth integration with Supabase Auth.
 */

import { getSupabase } from './supabase-client.js';
import { mockStore } from './mock-store.js';

export async function signInWithGoogle() {
  const supabase = await getSupabase();

  if (supabase.isMock) {
    let demoUser = mockStore.getCurrentUser();
    if (!demoUser) {
      demoUser = {
        id: 'user-' + Date.now(),
        email: 'user@dharashiv.org',
        full_name: '',
        role: 'member',
        is_active: true,
        is_profile_completed: false
      };
      mockStore.setCurrentUser(demoUser);
    }
    window.location.href = demoUser.is_profile_completed ? '/dashboard.html' : '/register.html';
    return;
  }

  const redirectUrl = `${window.location.origin}/auth-callback.html`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const supabase = await getSupabase();
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out warning:', err);
  }
  mockStore.setCurrentUser(null);
  window.location.href = '/login.html';
}

export async function getSession() {
  const supabase = await getSupabase();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session;
}

export async function getCurrentProfile() {
  const supabase = await getSupabase();

  if (supabase.isMock) {
    return mockStore.getCurrentUser();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile;
}

export async function handleAuthCallback() {
  const supabase = await getSupabase();

  if (supabase.isMock) {
    const user = mockStore.getCurrentUser();
    window.location.href = user?.is_profile_completed ? '/dashboard.html' : '/register.html';
    return;
  }

  // Live session check
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error(error?.message || 'Failed to authenticate session with Google.');
  }

  // Check if profile exists and is completed
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_profile_completed, role')
    .eq('id', session.user.id)
    .single();

  if (!profile || !profile.is_profile_completed) {
    window.location.href = '/register.html';
  } else {
    window.location.href = '/dashboard.html';
  }
}
