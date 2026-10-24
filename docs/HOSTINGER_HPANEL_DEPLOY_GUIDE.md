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

### Step 3: Laravel API Setup (MySQL + Composer, via SSH)

The repository is a standard Laravel app. The root `.htaccess` routes every request into `public/`,
which holds Laravel's `index.php` plus the static Next.js export. `app/`, `.env`, `vendor/` etc. are never web-reachable.

1. In hPanel, go to **Databases** ➔ **Management** and create a MySQL database + user (or reuse the existing one).
2. Enable **Advanced** ➔ **SSH Access**, connect, and run once:
   ```bash
   cd ~/public_html/softlogic
   composer install --no-dev --optimize-autoloader   # vendor/ is not in git
   cp .env.example .env
   php artisan key:generate
   ```
3. Edit `.env`:
   ```ini
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://ai.loopsintegrated.co/softlogic
   DB_HOST=localhost
   DB_SOCKET=
   DB_PORT=3306
   DB_DATABASE=u123456_checkhub
   DB_USERNAME=u123456_admin
   DB_PASSWORD=YourDatabasePassword
   ```
4. Create/upgrade the schema and seed the video catalogue (safe on a database created by the old `api/db.php`;
   existing views, exam starts and admin users are kept):
   ```bash
   php artisan migrate --force
   php artisan db:seed --class=VideoSeeder --force
   php artisan app:create-admin        # only if you need a new admin account
   php artisan config:cache && php artisan route:cache
   ```

After every deploy that changes `composer.lock` or adds migrations, re-run `composer install --no-dev`
and `php artisan migrate --force` (then `config:cache` / `route:cache` again).

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
  - Admin Access: Accounts live in the `users` table; create them with `php artisan app:create-admin`.

---

## 🔄 Making Future Updates Locally

Whenever you make changes to the code:
```bash
# 1. Build resources/nextjs and export the static site into public/
npm run build

# 2. Commit and push to GitHub
git add .
git commit -m "feat: your new feature"
git push origin main
```
Hostinger will automatically pull the commit and deploy it live to `ai.loopsintegrated.co/softlogic`!
