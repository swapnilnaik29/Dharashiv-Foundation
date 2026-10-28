/**
 * Supabase Edge Function: s3-download
 * Generates secure short-lived presigned GET URLs for authorized private file downloads (e.g. resumes).
 * Enforces ownership: only the applicant, the job poster, or an admin can access.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, GetObjectCommand } from "npm:@aws-sdk/client-s3@^3.500.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@^3.500.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req: Request) => {
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

    const { applicationId, s3Key, filename } = await req.json();

    if (!s3Key) {
      return new Response(JSON.stringify({ error: "Missing s3Key parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Check authorization in Supabase database
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    let isAuthorized = isAdmin;

    if (!isAuthorized && applicationId) {
      const { data: app } = await supabase
        .from("job_applications")
        .select(`
          applicant_id,
          job:jobs(poster_id)
        `)
        .eq("id", applicationId)
        .single();

      if (app) {
        // Applicant owns the resume
        if (app.applicant_id === user.id) {
          isAuthorized = true;
        }
        // Job poster is reviewing candidate
        const job = app.job as unknown as { poster_id: string } | null;
        if (job && job.poster_id === user.id) {
          isAuthorized = true;
        }
      }
    } else if (!isAuthorized) {
      // If no applicationId provided, verify key prefix contains user.id
      if (s3Key.includes(`/${user.id}/`)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Forbidden: You are not authorized to download this file." }), {
        status: 403,
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

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename || 'download.pdf')}"`
    });

    // 2-minute short-lived download URL
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 120 });

    return new Response(JSON.stringify({
      success: true,
      downloadUrl
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
