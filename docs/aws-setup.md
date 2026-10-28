# Amazon S3 & AWS IAM Setup Guide — Dharashiv Foundation

This document details configuring Amazon Web Services (AWS) S3 bucket storage, Cross-Origin Resource Sharing (CORS), and Identity & Access Management (IAM) permissions for secure file handling.

---

## 1. Create Private S3 Bucket

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Navigate to **S3 > Create bucket**.
3. Choose:
   - **Bucket name:** `dharashiv-foundation-storage` (must be globally unique)
   - **AWS Region:** `ap-south-1` (Asia Pacific - Mumbai)
4. Under **Block Public Access settings for this bucket**:
   - Keep **Block all public access** **ENABLED (Checked)**.
   - Resumes, media, and documents must not be publicly readable without signed URLs.
5. Enable **Server-side encryption** with Amazon S3 managed keys (SSE-S3).
6. Click **Create bucket**.

---

## 2. Configure S3 CORS (Cross-Origin Resource Sharing)

Direct binary uploads (`PUT` requests) from client browsers to pre-signed URLs require CORS authorization.

In the AWS S3 Console:
1. Select your bucket (`dharashiv-foundation-storage`).
2. Go to the **Permissions** tab.
3. Scroll down to **Cross-origin resource sharing (CORS)** and click **Edit**.
4. Paste the following JSON:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "PUT",
      "GET",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://*.supabase.co"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```
5. Click **Save changes**.

---

## 3. Create Least-Privilege IAM User & Policy

1. Go to **AWS IAM Console > Policies > Create policy**.
2. Switch to the **JSON** tab and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DharashivS3PresignAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::dharashiv-foundation-storage/*"
    }
  ]
}
```
3. Name the policy: `DharashivFoundationS3Policy`.
4. Navigate to **IAM > Users > Create user**.
   - User name: `dharashiv-edge-function-user`
5. Attach the newly created `DharashivFoundationS3Policy`.
6. Once created, go to the user's **Security credentials** tab.
7. Click **Create access key** (Application running outside AWS).
8. Copy the **Access Key ID** and **Secret Access Key**.

---

## 4. Bind AWS Credentials to Supabase Edge Functions

**SECURITY WARNING:** Never expose these keys to the frontend or git repository!

Store them exclusively in Supabase Edge Function Secrets:
```bash
supabase secrets set AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
supabase secrets set AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
supabase secrets set AWS_REGION=ap-south-1
supabase secrets set AWS_S3_BUCKET_NAME=dharashiv-foundation-storage
```
