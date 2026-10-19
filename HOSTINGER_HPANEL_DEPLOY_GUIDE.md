# Hostinger (hPanel) Git Deployment Guide for `ai.loopsintegrated.co/softlogic`

This repository is pre-configured for automated **Git Push Deployment** directly into **`public_html/softlogic`** on **`ai.loopsintegrated.co`** via Hostinger hPanel.

---

## 🚀 Fast 3-Step Setup in Hostinger hPanel

### Step 1: Link Git Repository in hPanel

1. Log in to your [Hostinger hPanel](https://hpanel.hostinger.com/).
2. Select **`ai.loopsintegrated.co`** (or your parent domain) and click **Manage**.
3. In the left navigation bar or search bar, navigate to **Advanced** ➔ **Git**.
4. Fill in the deployment details:
   - **Repository:** `https://github.com/dilmith-loops/softlogic-next.git`
   - **Branch:** `main`
   - **Install Directory:** `public_html/softlogic`
5. Click **Create**.
   *(Hostinger will automatically clone the repository into `public_html/softlogic`)*.

---

### Step 2: Configure Auto-Deployment Webhook (Deploy on Git Push)

To automatically deploy whenever you run `git push origin main`:

1. In hPanel under **Advanced** ➔ **Git**, locate the deployed repository entry.
2. Toggle on **Auto Deployment** and copy the **Webhook URL** provided by Hostinger:
   `https://hpanel.hostinger.com/api/git/deploy/...`
3. Go to GitHub in your browser:
   👉 **`https://github.com/dilmith-loops/softlogic-next/settings/hooks`**
4. Click **Add webhook**:
   - **Payload URL:** Paste your Hostinger Webhook URL.
   - **Content type:** `application/json`.
   - **Which events:** Select *Just the push event*.
   - **Active:** Checked.
5. Click **Add webhook**.

> 🎉 **Done!** From now on, whenever you run `git push origin main`, GitHub will notify Hostinger, and your site will update automatically in seconds!

---

### Step 3: MySQL Database Setup in hPanel (phpMyAdmin)

The tracking engine records real user IP addresses, video plays, and admin authentication in MySQL.

1. In hPanel, go to **Databases** ➔ **Management**.
2. Create a new MySQL Database:
   - **Database Name:** `u123456_checkhub` (or `checkhub_db`)
   - **Username:** `u123456_admin`
   - **Password:** Create a secure password.
3. Click **Enter phpMyAdmin** for your new database.
4. Click **Import** in the top bar ➔ choose file:
   [`backend/database/checkhub_db.sql`](backend/database/checkhub_db.sql) ➔ Click **Import**.
5. Set your DB credentials:
   Inside `public_html/softlogic/`, create or update a `.env` file (or edit `api/config.php`):
   ```ini
   DB_HOST=localhost
   DB_DATABASE=u123456_checkhub
   DB_USERNAME=u123456_admin
   DB_PASSWORD=YourDatabasePassword
   ```

*(Note: If you haven't imported the SQL yet, `api/db.php` also contains self-healing schema creation that will automatically create the `video_views` and `users` tables upon the first visit!)*

---

## 🌐 Live Verification & Features

Visit the live campaign in your browser:
👉 **`https://ai.loopsintegrated.co/softlogic/`**

### What is pre-configured and verified:
- **Base Path Routing:** Automatically resolves all assets, videos, images, and routes under `/softlogic/`.
- **Cyber Glitch Transition:** The Age Gate modal cleanly vanishes the instant Enter is clicked while the glitch animation tears across the video grid.
- **Mobile Responsive Layout:** On mobile viewports, the 3-minute examination action card is placed directly under the video player and above the video title.
- **Video Streaming with Byte-Range:** Pre-configured via `.htaccess` with `Accept-Ranges bytes` for smooth instant playback on mobile and desktop browsers.
- **Self-Examination Player:** Accessible at `https://ai.loopsintegrated.co/softlogic/exam/` with interactive step-by-step guidance, synchronized lyrics, and synthesized pulse.
- **Admin Analytics Dashboard:** Accessible at `https://ai.loopsintegrated.co/softlogic/admin/` with real IP logging, view counts, and CSV export.
  - Default Admin Email: `admin@softlogic.lk`
  - Default Password: `Admin@CheckHub2026`

---

## 🔄 Making Future Updates Locally

Whenever you make changes to the code:
```bash
# 1. Build and export the production bundle to root
npm run build

# 2. Commit and push to GitHub
git add .
git commit -m "feat: your new feature"
git push origin main
```
Hostinger will automatically pull the commit and deploy it live to `ai.loopsintegrated.co/softlogic`!
