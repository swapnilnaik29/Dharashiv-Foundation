/**
 * Dharashiv Foundation - Supabase Client Initializer
 * Integrates official @supabase/supabase-js SDK.
 * Dynamically switches between Live Supabase cloud and Mock store for local demos.
 */

import { CONFIG } from './config.js';
import { mockStore } from './mock-store.js';

let supabaseInstance = null;

// CDN loader for official Supabase JS SDK
async function loadSupabaseSDK() {
  if (window.supabase) {
    return window.supabase;
  }
  try {
    const module = await import('https://esm.sh/@supabase/supabase-js@2.39.0');
    return module;
  } catch (err) {
    console.warn('Failed to load Supabase SDK from CDN, using mock layer:', err);
    return null;
  }
}

export async function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  if (CONFIG.isLiveSupabaseConfigured()) {
    try {
      const sdk = await loadSupabaseSDK();
      if (sdk && sdk.createClient) {
        supabaseInstance = sdk.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        console.log('✅ Connected to Live Supabase Cloud:', CONFIG.SUPABASE_URL);
        return supabaseInstance;
      }
    } catch (e) {
      console.error('Error initializing live Supabase client:', e);
    }
  }

  // Fallback Dev / Mock Client Adapter
  console.info('ℹ️ Running in Local Demonstration Mode (Realistic Dharashiv Data). Live Supabase keys not set in config.js.');
  
  supabaseInstance = {
    isMock: true,
    auth: {
      async getSession() {
        const user = mockStore.getCurrentUser();
        if (!user) return { data: { session: null }, error: null };
        return {
          data: {
            session: {
              user,
              access_token: 'mock-access-token-jwt'
            }
          },
          error: null
        };
      },
      async getUser() {
        const user = mockStore.getCurrentUser();
        return { data: { user }, error: null };
      },
      async signInWithOAuth(opts) {
        console.log('Mock OAuth triggered:', opts);
        // Simulate redirect to callback
        const callbackUrl = new URL('/auth-callback.html', window.location.origin);
        callbackUrl.searchParams.set('code', 'mock-google-oauth-code');
        window.location.href = callbackUrl.toString();
        return { data: { url: callbackUrl.toString() }, error: null };
      },
      async signOut() {
        mockStore.setCurrentUser(null);
        return { error: null };
      },
      onAuthStateChange(callback) {
        // Return dummy subscription
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    },
    from(table) {
      return {
        select(fields = '*') {
          return {
            async eq(col, val) {
              if (table === 'profiles') {
                const profile = mockStore.getProfile(val);
                return { data: profile ? [profile] : [], error: null };
              }
              return { data: [], error: null };
            },
            async single() {
              if (table === 'profiles') {
                return { data: mockStore.getCurrentUser(), error: null };
              }
              return { data: null, error: null };
            },
            async order() {
              if (table === 'posts') return { data: mockStore.getPosts(), error: null };
              if (table === 'jobs') return { data: mockStore.getJobs(), error: null };
              if (table === 'events') return { data: mockStore.getEvents(), error: null };
              if (table === 'announcements') return { data: mockStore.getAnnouncements(), error: null };
              return { data: [], error: null };
            }
          };
        }
      };
    },
    channel(name) {
      return {
        on() { return this; },
        subscribe() { return this; },
        unsubscribe() { return this; }
      };
    }
  };

  return supabaseInstance;
}
