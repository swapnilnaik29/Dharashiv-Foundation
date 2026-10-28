# Deployment & Hosting Guide — Dharashiv Foundation

The Dharashiv Foundation frontend is written in standard HTML5, CSS3, and Vanilla JavaScript (ES modules) with zero frontend compilation dependencies. It can be served locally using Node.js or deployed as a high-performance static website to any cloud host (Cloudflare Pages, Vercel, AWS S3 + CloudFront, GitHub Pages, or Netlify).

---

## 1. Local Development (Node.js)

Start the local server:
```bash
npm start
# or
node server.js
```

The application will be served at `http://localhost:3000`.

---

## 2. Deploying to Cloudflare Pages / Vercel / Netlify

Because the frontend is static:
1. Connect your repository to the hosting platform.
2. Build Settings:
   - **Framework Preset:** None / Other / Static
   - **Build Command:** *(Leave empty)*
   - **Output Directory:** `.` (root directory)
3. Set your production domain in Google Cloud Console and Supabase Auth redirect URLs.

---

## 3. Deploying Frontend to AWS S3 & CloudFront

For an end-to-end AWS cloud architecture demonstration:
1. Create a public S3 bucket for the static website hosting (e.g. `dharashiv-frontend-bucket`).
2. Sync the project files (excluding `node_modules`, `supabase/`, and `.git`):
   ```bash
   aws s3 sync . s3://dharashiv-frontend-bucket/ --exclude "node_modules/*" --exclude "supabase/*" --exclude ".git/*"
   ```
3. Set up an AWS CloudFront distribution pointing to the S3 bucket with an SSL certificate from AWS Certificate Manager (ACM).
