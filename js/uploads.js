/**
 * Dharashiv Foundation - Cloud Storage Handler
 * Integrates directly with Supabase Storage buckets.
 */

import { getSupabase } from './supabase-client.js';
import { CONFIG } from './config.js';
import { validateFile } from './validators.js';

const ALLOWED_MIME_TYPES = {
  avatar: ['image/jpeg', 'image/png', 'image/webp'],
  post_media: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  resume: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  attachment: ['application/pdf', 'image/jpeg', 'image/png']
};

export async function uploadFileToStorage({ file, uploadType }) {
  const allowed = ALLOWED_MIME_TYPES[uploadType] || ALLOWED_MIME_TYPES.post_media;
  const validation = validateFile(file, allowed, 15 * 1024 * 1024);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Determine bucket
  let bucketName = CONFIG.STORAGE_BUCKETS.POST_MEDIA;
  if (uploadType === 'avatar') bucketName = CONFIG.STORAGE_BUCKETS.AVATARS;
  else if (uploadType === 'resume') bucketName = CONFIG.STORAGE_BUCKETS.RESUMES;
  else if (uploadType === 'announcement_attachment') bucketName = CONFIG.STORAGE_BUCKETS.ATTACHMENTS;

  const supabase = await getSupabase();

  if (supabase.isMock) {
    const mockUrl = URL.createObjectURL(file);
    const mockPath = `${uploadType}/local_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    return {
      success: true,
      fileUrl: mockUrl,
      storagePath: mockPath,
      objectKey: mockPath, // Compatibility
      filename: file.name
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('You must be signed in to upload files.');

  const userId = session.user.id;
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${userId}/${Date.now()}_${cleanFileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(error.message || 'File upload failed');
  }

  // If public bucket, get public URL
  let fileUrl = '';
  if (bucketName !== CONFIG.STORAGE_BUCKETS.RESUMES) {
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    fileUrl = publicData?.publicUrl || '';
  }

  return {
    success: true,
    fileUrl,
    storagePath: filePath,
    objectKey: filePath, // Compatibility
    filename: file.name
  };
}

// Backward compatibility alias
export const uploadFileToS3 = uploadFileToStorage;

export async function getAuthorizedDownloadUrl({ applicationId, s3Key, storagePath, filename }) {
  const filePath = storagePath || s3Key;
  if (!filePath) throw new Error('Storage path not specified');

  const supabase = await getSupabase();

  if (supabase.isMock) {
    const sampleBlob = new Blob([
      `Dharashiv Foundation - Candidate Document\nFilename: ${filename}\nDate: ${new Date().toLocaleDateString()}`
    ], { type: 'application/pdf' });
    return URL.createObjectURL(sampleBlob);
  }

  // Generate 5-minute signed URL from Supabase Storage
  const { data, error } = await supabase.storage
    .from(CONFIG.STORAGE_BUCKETS.RESUMES)
    .createSignedUrl(filePath, 300, {
      download: filename || 'resume.pdf'
    });

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Failed to generate download URL');
  }

  return data.signedUrl;
}
