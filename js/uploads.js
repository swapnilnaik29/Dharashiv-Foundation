/**
 * Dharashiv Foundation - S3 File Upload & Download Handler
 * Integrates with Supabase Edge Functions 's3-presign' and 's3-download'.
 */

import { getSupabase } from './supabase-client.js';
import { validateFile } from './validators.js';

export async function uploadFileToS3({ file, uploadType }) {
  // Validate locally first
  const allowed = {
    avatar: ['image/jpeg', 'image/png', 'image/webp'],
    post_media: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    resume: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    announcement_attachment: ['application/pdf', 'image/jpeg', 'image/png']
  };

  const validation = validateFile(file, allowed[uploadType], 15 * 1024 * 1024);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const supabase = await getSupabase();

  if (supabase.isMock) {
    // Demonstration mock upload: create object URL
    const mockUrl = URL.createObjectURL(file);
    const mockKey = `${uploadType}/demo/${Date.now()}_${file.name}`;
    console.info('Simulated S3 Upload success:', mockKey);
    return {
      success: true,
      fileUrl: mockUrl,
      objectKey: mockKey,
      filename: file.name
    };
  }

  // Get active session token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('You must be logged in to upload files.');

  // 1. Call s3-presign Edge Function
  const { data: presignData, error: presignError } = await supabase.functions.invoke('s3-presign', {
    body: {
      uploadType,
      filename: file.name,
      contentType: file.type,
      fileSize: file.size
    }
  });

  if (presignError || !presignData?.uploadUrl) {
    throw new Error(presignError?.message || 'Failed to request S3 upload authorization.');
  }

  // 2. Perform direct binary PUT to Amazon S3
  const s3Response = await fetch(presignData.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });

  if (!s3Response.ok) {
    throw new Error(`S3 upload failed with status ${s3Response.status}`);
  }

  return {
    success: true,
    fileUrl: presignData.fileUrl,
    objectKey: presignData.objectKey,
    filename: file.name
  };
}

export async function getAuthorizedDownloadUrl({ applicationId, s3Key, filename }) {
  const supabase = await getSupabase();

  if (supabase.isMock) {
    // In mock mode: generate dummy download blob
    const sampleBlob = new Blob([
      `Dharashiv Foundation - Candidate Resume Document\nFile: ${filename}\nDate: ${new Date().toLocaleDateString()}`
    ], { type: 'application/pdf' });
    return URL.createObjectURL(sampleBlob);
  }

  // Call s3-download Edge Function
  const { data, error } = await supabase.functions.invoke('s3-download', {
    body: { applicationId, s3Key, filename }
  });

  if (error || !data?.downloadUrl) {
    throw new Error(error?.message || 'Failed to authorize file download.');
  }

  return data.downloadUrl;
}
