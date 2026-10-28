# Dharashiv Foundation — Cloud-Based Regional Community Network

[![Cloud Architecture](https://img.shields.io/badge/Architecture-Cloud--Native-FF7A18.svg)](#)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E.svg)](#)
[![Storage](https://img.shields.io/badge/Storage-Amazon%20S3-569A31.svg)](#)
[![Auth](https://img.shields.io/badge/Auth-Google%20OAuth-4285F4.svg)](#)
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20ES%20Modules-702507.svg)](#)

A modern, cloud-based regional community networking platform built for **Dharashiv District** (Maharashtra). Designed to connect local entrepreneurs, farmers, doctors, engineers, and youth across all 8 talukas: **Dharashiv, Tuljapur, Omerga, Paranda, Bhoom, Kalamb, Washi, and Lohara**.

Developed as a College Cloud Computing Capstone Project demonstrating **Cloud Authentication, Relational Database with Row-Level Security, Amazon S3 Storage with Pre-Signed URLs, Supabase Realtime, and Role-Based Access Control (RBAC)**.

---

## 🎨 Brand Identity & Visual Design

The platform uses a distinctive regional brand palette honoring Dharashiv's heritage:

- **Primary Dark Brown:** `#702507` (Sidebar and brand headers)
- **Primary Rust:** `#A83208` (Sub-headers and accent badges)
- **Primary Orange:** `#FF7A18` (Primary CTAs and active states)
- **Light Orange:** `#FFF0E2` (Surface highlights and active pills)
- **Warm Background:** `#FAF8F5` (Canvas background)
- **White Surface:** `#FFFFFF` (Cards and panels)
- **Primary Text:** `#1D1D1F` (High contrast typography)
- **Secondary Text:** `#777783` (Meta descriptions and subtext)
- **Borders:** `#E8E1DA` (Subtle card and input borders)

---

## 🏗️ Cloud Architecture & Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES Modules) | Lightweight, static website deployment, zero frontend frameworks. |
| **Authentication** | Google OAuth via Supabase Auth | Secure, single sign-on without passwords or SMS OTP. |
| **Relational Database** | Supabase PostgreSQL | 17 structured tables with primary/foreign keys, indexes, and triggers. |
| **Security Layer** | Row-Level Security (RLS) | Database-enforced isolation ensuring users only access authorized records. |
| **Realtime Sync** | Supabase Realtime | Instant direct message synchronization via WebSocket replication. |
| **Object Storage** | Amazon S3 | Private bucket storing post media, resumes, and attachments. |
| **Serverless Functions** | Supabase Edge Functions (Deno / AWS SDK v3) | Server-side validation and short-lived presigned upload/download URLs. |

---

## 🚀 Key Features

1. **Google OAuth & Profile Completion:**
   - Single-click Google login. First-time users are prompted to specify native village, taluka, current city, and profession.
2. **Member Dashboard:**
   - Personalized greeting, profile strength indicator, community updates ticker, and quick action bar.
3. **Regional Social Feed:**
   - Create updates, upload media directly to Amazon S3, like and comment on community achievements, report inappropriate content.
4. **Member Directory & Networking:**
   - Search by name, taluka, sector, or service. Send connection requests, manage mutual partnerships.
5. **Realtime Direct Messaging:**
   - Private 1-on-1 conversations between connected members with instant sync.
6. **Job Board & Private S3 Resumes:**
   - Post vacancies, browse local opportunities, apply with PDF/DOCX resumes. Resumes are stored in a private S3 bucket and only accessible through authorized, short-lived download links.
7. **Community Events & Announcements:**
   - Regional workshops, summit schedules, RSVP tracking, and verified announcements.
8. **Administrator Portal:**
   - Privileged management of member accounts, content moderation queue, job postings, and platform settings.

---

## 📁 Project Structure

```
dharashiv-foundation/
├── package.json
├── server.js                      # Zero-dependency local Node.js static file server
├── .env.example                   # Environment configuration template
├── README.md
├── index.html                     # Landing page with platform overview & highlights
├── login.html                     # Google OAuth Sign-In page
├── auth-callback.html             # OAuth redirect token exchange handler
├── register.html                  # Member profile onboarding wizard
├── dashboard.html                 # Main member dashboard
├── feed.html                      # Regional social feed
├── discover.html                  # Member directory & search filters
├── profile.html                   # Member profile view & edit modal
├── connections.html               # Network & incoming requests management
├── messages.html                  # Realtime direct messaging
├── jobs.html                      # Regional job board & vacancy posting
├── job-details.html               # Job description & resume upload apply modal
├── applications.html              # Candidate applications & employer review
├── events.html                    # Events calendar & RSVP registration
├── announcements.html             # Announcements & submission
├── notifications.html             # Notifications center
├── settings.html                  # Account preferences & dark mode toggle
├── admin/                         # Privileged Administrative Management Portal
│   ├── index.html                 # Admin metrics & member table
│   ├── members.html               # Account moderation & role control
│   ├── moderation.html            # Content moderation queue
│   ├── jobs.html                  # Job vacancy management
│   ├── events.html                # Event scheduling
│   ├── announcements.html         # Notice approvals
│   ├── categories.html            # Industry categories
│   └── settings.html              # System settings & guidelines
├── assets/
│   ├── logos/                     # Original SVG logos & favicon
│   ├── illustrations/             # Original SVG illustrations (auth, empty states)
│   └── avatars/                   # Profile avatars
├── css/                           # Modular CSS architecture
│   ├── variables.css              # Design tokens & color variables
│   ├── reset.css                  # Modern CSS reset
│   ├── global.css                 # Layout scaffolding, sidebar, and header
│   ├── components.css             # Buttons, cards, modals, badges, toasts
│   ├── auth.css                   # Login & registration wizard styling
│   ├── dashboard.css              # Dashboard cards & ticker
│   ├── feed.css                   # Post cards, comments, media preview
│   ├── profile.css                # Profile headers and info grids
│   ├── jobs.css                   # Job cards and upload dropzones
│   ├── admin.css                  # Admin tables and moderation cards
│   └── responsive.css             # Mobile drawer and tablet breakpoints
├── js/                            # Vanilla JavaScript ES Modules
│   ├── config.js                  # Client configuration & live key checker
│   ├── supabase-client.js         # Supabase SDK client & mock fallback adapter
│   ├── mock-store.js              # Local demonstration store with Dharashiv data
│   ├── auth.js                    # Google OAuth sign-in & session management
│   ├── guards.js                  # Protected routes & admin authorization
│   ├── navigation.js              # Sidebar, top bar, and mobile drawer
│   ├── ui.js                      # Toasts, modals, formatters
│   ├── validators.js              # Form and file validation
│   ├── registration.js            # Profile onboarding logic
│   ├── profiles.js                # Profile rendering & modal editing
│   ├── posts.js                   # Feed management & post creation
│   ├── connections.js             # Member discovery & connection lifecycle
│   ├── messages.js                # Direct chat & Supabase Realtime listener
│   ├── jobs.js                    # Job board operations
│   ├── applications.js            # Resume upload & private download
│   ├── events.js                  # Events & RSVP
│   ├── announcements.js           # Announcement listings
│   ├── notifications.js           # Notification polling & read status
│   ├── uploads.js                 # AWS S3 presigned upload & download handler
│   └── admin.js                   # Admin metrics & moderation queue
├── supabase/
│   ├── migrations/
│   │   ├── 20261028000001_initial_schema.sql
│   │   ├── 20261028000002_functions_triggers.sql
│   │   ├── 20261028000003_rls_policies.sql
│   │   └── 20261028000004_seed_data.sql
│   └── functions/
│       ├── s3-presign/index.ts    # Edge Function for short-lived upload URLs
│       └── s3-download/index.ts   # Edge Function for private resume downloads
└── docs/                          # Detailed engineering documentation
    ├── supabase-setup.md
    ├── google-oauth-setup.md
    ├── aws-setup.md
    ├── deployment.md
    ├── security.md
    └── testing-checklist.md
```

---

## ⚡ Quick Start (Local Development)

### 1. Start the Local Server
```bash
npm start
```
The server will start at **`http://localhost:3000`**.

> **Note on Demonstration Mode:**
> If you have not entered live Supabase or AWS credentials into `js/config.js` or `.env`, the application automatically activates **Demonstration Mode**. It loads realistic members, businesses, jobs, and events from Dharashiv district so you can test all UI flows, connections, posting, chat, and applications out-of-the-box!

### 2. Connect Live Cloud Services (Optional for Production)
1. Follow [docs/supabase-setup.md](docs/supabase-setup.md) to create your database and run migrations.
2. Follow [docs/google-oauth-setup.md](docs/google-oauth-setup.md) to set up Google Cloud credentials.
3. Follow [docs/aws-setup.md](docs/aws-setup.md) to configure your private S3 bucket and deploy Edge Functions.
4. Set your credentials in `js/config.js` or `.env`.

---

## 🎓 Academic Presentation Notes

- **Cloud Platform:** Supabase (BaaS) + Amazon Web Services (IaaS/Storage).
- **Security Concept:** Row-Level Security (RLS) ensures multi-tenant database protection at the SQL engine level.
- **Direct S3 Uploads:** Files never pass through intermediate application servers; client browsers upload directly to S3 using short-lived pre-signed URLs.
- **Zero Frontend Frameworks:** Implemented cleanly in native ES modules and vanilla CSS for maximum speed and zero build-step overhead.
