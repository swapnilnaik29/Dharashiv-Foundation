# Security Architecture — Dharashiv Foundation

This document details the multi-layered security controls implemented to protect member data, prevent unauthorized administrative access, and secure file uploads.

---

## 1. Authentication Security (Google OAuth Only)

- **Single Sign-On (SSO):** Traditional username/password authentication and SMS OTP are intentionally prohibited to eliminate credential stuffing, brute force attacks, and SIM-swapping vulnerabilities.
- **Session Verification:** Frontend tokens are verified cryptographically via Supabase Auth. The client application never assumes authentication based on URL query parameters or localStorage flags alone.

---

## 2. PostgreSQL Row Level Security (RLS)

Every database table has Row Level Security enabled. Policies enforce strict zero-trust rules:

- **Ownership-based Access:** Tables such as `profiles`, `posts`, `comments`, and `job_applications` verify `auth.uid() = author_id` or `auth.uid() = applicant_id`.
- **Privilege Escalation Prevention:** A user updating their own profile via `UPDATE profiles` is barred by RLS from altering their assigned `role` or `is_active` status.
- **Conversations & Messages:** A user can only select messages if they exist as a participant in `conversation_participants`.

---

## 3. Secure File Storage & Amazon S3 Integration

- **Private S3 Bucket:** S3 public access is blocked completely. No direct public links to candidate resumes or sensitive attachments exist.
- **Pre-signed URL Architecture:**
  1. Frontend submits metadata (filename, mime-type, byte size) to the `s3-presign` Supabase Edge Function.
  2. Edge function validates user JWT session, checks file constraints (e.g. max 15MB, PDF/DOCX only for resumes), and calls AWS SDK v3 to generate a 300-second upload URL.
  3. Client uploads directly to S3 via HTTP PUT without passing through the database server.
- **Authorized Resume Downloads:**
  - When reviewing a resume, the `s3-download` Edge Function checks if the requester is either the applicant, the job poster, or a platform administrator before emitting a 120-second download URL.

---

## 4. Role-Based Access Control (RBAC)

- Default role on registration is strictly `member`.
- Administrative privileges (`role = 'admin'`) can only be provisioned server-side by database operators.
- Protected admin routes in the frontend verify server session data before rendering management tools.
