# Testing Checklist — Dharashiv Foundation

Use this verification matrix during evaluation and college presentation demonstrations.

---

## 1. Authentication & Session Flow
- [ ] **Google OAuth Sign-in Initiation:** Clicking "Sign in with Google" prompts the OAuth provider with correct client credentials.
- [ ] **Callback Processing:** `auth-callback.html` processes redirect tokens without console exceptions.
- [ ] **New Member Profile Requirement:** Users with `is_profile_completed = false` are automatically redirected to `register.html`.
- [ ] **Returning Member Flow:** Users with complete profiles are redirected directly to `dashboard.html`.
- [ ] **Sign Out:** Sign out terminates the active session, clears state, and redirects to `login.html`.

---

## 2. Profile Management
- [ ] **Registration Form Validation:** Required fields (Name, Taluka, Village, City, Profession) block submission if empty.
- [ ] **Conditional Enterprise Fields:** Selecting "Business Owner / Entrepreneur" displays Company Name, Category, Description, and Services.
- [ ] **District & Talukas:** Taluka dropdown lists all 8 official talukas: Dharashiv, Tuljapur, Omerga, Paranda, Bhoom, Kalamb, Washi, Lohara.
- [ ] **Profile Updates:** Editing profile details saves without resetting the member role.

---

## 3. Social Media Feed
- [ ] **Create Post:** Text posts appear immediately at the top of the feed with author details and taluka.
- [ ] **Media Upload:** Selecting an image uploads to S3 and renders an image card.
- [ ] **Like / Unlike:** Clicking Like increments the counter and prevents duplicate votes.
- [ ] **Comments:** Adding a comment renders beneath the post with author avatar.
- [ ] **Delete Post:** Authors or administrators can delete posts.
- [ ] **Report Content:** Clicking "Report" opens the modal and dispatches an incident to the admin moderation queue.

---

## 4. Member Directory & Networking
- [ ] **Directory Search:** Searching by name, business, or keyword filters the cards in real-time.
- [ ] **Taluka Filter:** Filtering by taluka isolates members from that specific region.
- [ ] **Connection Lifecycle:** Sending a request transitions state from "Connect" to "Requested"; recipient sees request under "Incoming Requests" with "Accept" / "Reject" actions.

---

## 5. Direct Messaging & Realtime
- [ ] **Chat Navigation:** Clicking "Message" opens the chat window with active conversation context.
- [ ] **Message Delivery:** Sending a message updates the chat window and persists timestamp.
- [ ] **Realtime Updates:** Subscribed Supabase Realtime channel broadcasts new messages across browser tabs.

---

## 6. Jobs & Amazon S3 Resume Integration
- [ ] **Browse & Search Jobs:** Job filters by taluka, category, and employment type.
- [ ] **Post Vacancy:** Job creation modal validates inputs and updates the job board.
- [ ] **Resume Upload:** Uploading a PDF resume invokes the `s3-presign` Edge Function and saves S3 key.
- [ ] **Private Resume Download:** Employers reviewing candidate applications click "Download Resume" to generate a short-lived download link. Unauthorized members are blocked.

---

## 7. Community Events & Announcements
- [ ] **Events Calendar:** View dates, times, venues, and attendee counts.
- [ ] **RSVP:** Clicking "RSVP" registers attendance.
- [ ] **Announcements:** Official notices and member submissions render with priority badges.

---

## 8. Administrator Portal
- [ ] **Role Guard:** Non-admin users attempting to open `/admin/` are redirected to `/dashboard.html`.
- [ ] **Member Moderation:** Admins can activate or deactivate accounts.
- [ ] **Moderation Queue:** Flagged posts can be reviewed, dismissed, or deleted.
