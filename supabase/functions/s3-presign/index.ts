/**
 * Supabase Edge Function: s3-presign
 * Generates secure short-lived presigned PUT URLs for AWS S3 uploads.
 * Verifies authenticated Supabase user session, validates MIME type and file size.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@^3.500.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@^3.500.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Allowed file types and max sizes
const ALLOWED_UPLOADS: Record<string, { mimes: string[]; maxSize: number }> = {
  avatar: {
    mimes: ["image/jpeg", "image/png", "image/webp"],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  post_media: {
    mimes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  resume: {
    mimes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    maxSize: 15 * 1024 * 1024 // 15MB
  },
  announcement_attachment: {
    mimes: ["application/pdf", "image/jpeg", "image/png"],
    maxSize: 15 * 1024 * 1024 // 15MB
  }
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Initialize Supabase Client to verify JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { uploadType, filename, contentType, fileSize } = await req.json();

    const uploadConfig = ALLOWED_UPLOADS[uploadType];
    if (!uploadConfig) {
      return new Response(JSON.stringify({ error: `Invalid uploadType: ${uploadType}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!uploadConfig.mimes.includes(contentType)) {
      return new Response(JSON.stringify({
        error: `Content-Type '${contentType}' is not permitted for ${uploadType}. Allowed: ${uploadConfig.mimes.join(", ")}`
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (fileSize && fileSize > uploadConfig.maxSize) {
      return new Response(JSON.stringify({
        error: `File size exceeds the limit of ${uploadConfig.maxSize / (1024 * 1024)}MB`
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // AWS Configuration
    const region = Deno.env.get("AWS_REGION") || "ap-south-1";
    const bucketName = Deno.env.get("AWS_S3_BUCKET_NAME") || "dharashiv-foundation-storage";
    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID") || "";
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY") || "";

    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    // Generate safe, unique S3 key
    const fileExt = filename.split(".").pop()?.toLowerCase() || "bin";
    const fileUuid = crypto.randomUUID();
    const objectKey = `${uploadType}/${user.id}/${fileUuid}.${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
      Metadata: {
        userId: user.id,
        originalFilename: encodeURIComponent(filename),
        uploadType
      }
    });

    // 5-minute expiry for upload
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return new Response(JSON.stringify({
      success: true,
      uploadUrl,
      objectKey,
      fileUrl: `https://${bucketName}.s3.${region}.amazonaws.com/${objectKey}`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
