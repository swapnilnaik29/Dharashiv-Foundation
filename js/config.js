/**
 * Dharashiv Foundation - Client Configuration
 */

export const CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: window.__ENV__?.SUPABASE_URL || 'https://oikkzgcdsianrlnmctdu.supabase.co',
  SUPABASE_ANON_KEY: window.__ENV__?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2t6Z2Nkc2lhbnJsbm1jdGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxODEwNzMsImV4cCI6MjEwODc1NzA3M30.5Z33vESrMA-WN-Lfgb_hmnBD0PJ8KOcG6rGA85m1fUA',

  // Storage Buckets
  STORAGE_BUCKETS: {
    POST_MEDIA: 'post-media',
    RESUMES: 'resumes',
    AVATARS: 'avatars',
    ATTACHMENTS: 'attachments'
  },

  // Regional Information
  APP_NAME: 'Dharashiv Foundation',
  APP_TAGLINE: 'Regional Community & Business Networking Platform',
  DISTRICT: 'Dharashiv',
  TALUKAS: [
    'Dharashiv',
    'Tuljapur',
    'Omerga',
    'Paranda',
    'Bhoom',
    'Kalamb',
    'Washi',
    'Lohara'
  ],

  // Check if live Supabase is configured
  isLiveSupabaseConfigured() {
    return (
      this.SUPABASE_URL &&
      !this.SUPABASE_URL.includes('placeholder') &&
      this.SUPABASE_ANON_KEY &&
      !this.SUPABASE_ANON_KEY.includes('placeholder')
    );
  }
};
