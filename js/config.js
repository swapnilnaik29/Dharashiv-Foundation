/**
 * Dharashiv Foundation - Client Configuration
 * Handles Supabase URL, Public Anon Key, and AWS S3 configuration.
 *
 * NOTE: For college presentation and local development, you can paste your
 * Supabase project credentials below. If left blank, the app will run in
 * "Development / Demonstration Mode" with rich local mock data from Dharashiv.
 */

export const CONFIG = {
  // Supabase Configuration (Client-safe public keys only)
  SUPABASE_URL: window.__ENV__?.SUPABASE_URL || 'https://placeholder-dharashiv.supabase.co',
  SUPABASE_ANON_KEY: window.__ENV__?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-anon-key',

  // AWS Configuration (Used only for direct public asset path rendering)
  AWS_REGION: window.__ENV__?.AWS_REGION || 'ap-south-1',
  AWS_S3_BUCKET: window.__ENV__?.AWS_S3_BUCKET_NAME || 'dharashiv-foundation-storage',

  // Application Settings
  APP_NAME: 'Dharashiv Foundation',
  APP_TAGLINE: 'Cloud-Based Regional Community Network',
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

  // Check if live Supabase is properly configured
  isLiveSupabaseConfigured() {
    return (
      this.SUPABASE_URL &&
      !this.SUPABASE_URL.includes('placeholder') &&
      this.SUPABASE_ANON_KEY &&
      !this.SUPABASE_ANON_KEY.includes('placeholder')
    );
  }
};
