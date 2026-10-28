# Dharashiv Foundation — Community Network Platform

A modern, cloud-based regional networking and community platform built for **Dharashiv District**, connecting local entrepreneurs, professionals, healthcare providers, and innovators across all 8 talukas: **Dharashiv, Tuljapur, Omerga, Paranda, Bhoom, Kalamb, Washi, and Lohara**.

---

## Features

* **Google Single Sign-On:** Instant, secure authentication via Google OAuth managed by Supabase Auth.
* **Member Directory:** Real-time search and filter members by native village, taluka, and industry sector.
* **Community Social Feed:** Share updates, post media, engage via likes and comments, and report inappropriate content.
* **Regional Job Board:** Discover local career opportunities and apply with resume uploads stored in encrypted cloud storage.
* **Direct Messaging:** Peer-to-peer chat between connected members with real-time message synchronization.
* **Community Events & Announcements:** Regional summit schedules, workshop agendas, and verified broadcasts.
* **Administration Portal:** Dedicated dashboard for account moderation, content reviews, and platform configuration.

---

## Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES Modules)
* **Backend & Database:** Supabase PostgreSQL with Row-Level Security (RLS)
* **Storage:** Supabase Storage (Encrypted Resumes, Public Post Media, Avatars)
* **Realtime:** Supabase Realtime (WebSocket Replication)
* **Hosting:** Vercel

---

## Project Structure

```
dharashiv-foundation/
├── index.html                 # Landing page
├── login.html                 # Sign-in page
├── auth-callback.html         # OAuth callback handler
├── register.html              # Profile completion wizard
├── dashboard.html             # Member dashboard
├── feed.html                  # Community social feed
├── discover.html              # Member directory & filters
├── profile.html               # Member profile view & edit
├── connections.html           # Connections & network requests
├── messages.html              # Direct messaging & chat
├── jobs.html                  # Regional job board
├── job-details.html           # Job details & application modal
├── applications.html          # Candidate & employer applications
├── events.html                # Events calendar & RSVP
├── announcements.html         # Announcements & submissions
├── notifications.html         # Notifications center
├── settings.html              # Account & theme settings
├── admin/                     # Administration Portal
│   ├── index.html             # Admin overview & metrics
│   ├── members.html           # Member account management
│   ├── moderation.html        # Content moderation queue
│   ├── jobs.html              # Job listings management
│   ├── events.html            # Event scheduling
│   ├── announcements.html     # Notice moderation
│   ├── categories.html        # Industry classifications
│   └── settings.html          # Platform settings
├── assets/                    # Logos, avatars, and illustrations
├── css/                       # Modular design system & stylesheets
├── js/                        # Client logic (ES Modules)
├── dev-server.js              # Local development server
├── vercel.json                # Vercel deployment configuration
├── package.json               # Package configuration
├── setup.md                   # Complete Supabase & Vercel deployment guide
└── README.md
```

---

## Quick Start (Local Development)

Start the local development server:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## Deployment & Setup

For full instructions on configuring Supabase (Database, Google OAuth, Storage buckets) and deploying to Vercel, refer to [setup.md](setup.md).
