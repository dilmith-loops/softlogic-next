# CheckHub - Next.js Full-Stack Breast Cancer Awareness Platform

A full-stack rewrite of **CheckHub**, an interactive breast cancer awareness and early detection web platform. Built with a **Next.js 15 (App Router)** frontend, a **Laravel 11 REST API backend**, and a **MySQL** database (`checkhub_db`).

---

## 🌟 Key Features

1. **Provocative Awareness Experience**:
   - Age verification disclaimer gate ("This is an adult website").
   - Reality distortion / canvas pixel glitch transition with sound and scanlines.
   - Video catalogue with categories, instant search, and dynamic sorting.
2. **Video Player Dialog & Real-Time IP View Logging**:
   - Native HTML5 video player with awareness stream channel switcher (`Doctor FAQs`, `Awareness Coalition PSA`, `Clinical Palpation Exam`, `Healthy Driven PSA`).
   - **Database View Tracking**: Every time a video is played or switched in the video player dialog, the user's **real IP address** (`$request->ip()`, supporting reverse proxies/Cloudflare) and exact **time and date** (`now()`) are automatically persisted to the `video_views` table in MySQL.
   - Live banner inside player dialog displays the client's logged IP, timestamp, and real-time total view counter.
3. **Interactive 3-Minute Breast Self-Exam Guide** (`/exam`):
   - 6-step clinical palpation sequence with on-screen countdown timer, checklists, step navigation, and completed summary.
4. **Interactive Modals**:
   - 5-step clinical touch guide modal.
   - Monthly calendar reminder modal with `.ics` file generator.
   - Multi-platform social share modal.
5. **Admin Analytics Dashboard** (`/admin`):
   - **Zero Hardcoding**: Admin credentials are **NOT** hardcoded in code and **NOT** in `.env`. They are authenticated directly against the MySQL `users` table.
   - **Real-Time Metrics**: Total views recorded in DB, unique user IPs tracked, today's views, and active videos.
   - **Live View Logs Stream**: Paginated table listing every recorded view, Video ID & Title, User IP address (with one-click copy), timestamp, and User-Agent/Device.
   - **Search & Filters**: Search by IP address, filter by video, filter by date range.
   - **Breakdown Tables**: Views per video and Top active viewer IP addresses.
   - **Export to CSV**: Download full view logs report.
   - **Database Admin Management**: Register new administrators directly into MySQL from the dashboard.

---

## 🗄️ Database Architecture (MySQL: `checkhub_db`)

### 1. `users` Table
Stores administrator credentials securely using bcrypt.
- `id` (bigint)
- `name` (string)
- `email` (string, unique)
- `password` (string, bcrypt hashed)
- `role` (string: `'admin'`)
- `created_at`, `updated_at`

### 2. `videos` Table
Stores the 12 awareness videos and base catalog metrics.
- `id` (string primary key, e.g., `vid-1`)
- `title`, `category`, `duration`, `duration_sec`
- `views_base_count` (bigint)
- `rating`, `date_text`, `author`, `author_title`, `author_verified`
- `description`, `key_points` (JSON), `animation_type`, `accent_color`, `icon`, `badge`, `video_src`

### 3. `video_views` Table
Records every video play event with user IP and timestamp.
- `id` (bigint auto-increment)
- `video_id` (string, index)
- `video_title` (string)
- `video_src` (string, nullable)
- `ip_address` (string, max 45 chars, index) - **User IP Address (IPv4 / IPv6)**
- `user_agent` (text, nullable)
- `viewed_at` (timestamp, index) - **Exact Date and Time**
- `created_at`, `updated_at`

---

### 4. `exam_starts` Table
Records every consented "Take Breast Examination" click.
- `id`, `ip_address`, `user_agent`, `video_id` (nullable), `consented`, `started_at`

---

## 🔐 Administrator Credentials

Admin accounts live only in the MySQL `users` table. No credentials are stored in code.

- **Create/reset an admin from the CLI**:
  ```bash
  php artisan app:create-admin
  # Or non-interactively:
  php artisan app:create-admin --name="Security Admin" --email="it@checkhub.org" --password="YourSecurePassword123"
  ```
- **Seeder**: `php artisan db:seed` creates an admin only when `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` are set in `.env`.
- **Web UI**: authenticated administrators can click `+ Add Admin (DB)` in `/admin`.

---

## 🚀 Getting Started

### Prerequisites
- PHP >= 8.3 with `pdo_mysql`
- Composer 2
- MySQL Server
- Node.js >= 20 and npm

### 1. Laravel (API)
```bash
composer install
cp .env.example .env
php artisan key:generate
# Configure DB_* in .env, then:
php artisan migrate --seed
```

### 2. Next.js (UI, in resources/nextjs)
```bash
npm --prefix resources/nextjs install
```

### 3. Run locally
```bash
npm run dev            # php artisan serve (:8000) + next dev (:3000)
```
Visit **`http://localhost:3000/softlogic/`**. The Next dev server proxies `/softlogic/api/*` to Laravel.

### 4. Build for production
```bash
npm run build          # next build, then copies the static export into public/
```
Commit the updated `public/` output; see [docs/HOSTINGER_HPANEL_DEPLOY_GUIDE.md](docs/HOSTINGER_HPANEL_DEPLOY_GUIDE.md).

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/videos` | Fetch videos with real view & unique IP counts | Public |
| `GET` | `/api/videos/{id}` | Fetch single video details | Public |
| `POST` | `/api/views` | **Record video play event with user IP & timestamp** (30/min per IP) | Public |
| `POST` | `/api/exam-starts` | Record a consented self-exam start (10/min per IP; alias `/api/exam/start`) | Public |
| `POST` | `/api/admin/login` | Authenticate admin (locks IP for 15 min after 5 failures) | Public |
| `POST` | `/api/admin/logout` | Revoke admin access token | Sanctum |
| `GET` | `/api/admin/me` | Get authenticated admin profile | Sanctum |
| `GET` | `/api/admin/stats` | Overview metrics, video breakdowns, top IPs, exam starts | Sanctum |
| `GET` | `/api/admin/views` | Paginated view logs with IP addresses & dates | Sanctum |
| `GET` | `/api/admin/exam-starts` | Paginated consented exam starts | Sanctum |
| `GET` | `/api/admin/export` | Download CSV (`?type=views` default, `?type=exam`) | Sanctum |
| `POST` | `/api/admin/users` | Create a new administrator | Sanctum |
| `POST` | `/api/admin/profile` | Update own name, email, optional password | Sanctum |

On Hostinger these are served under `/softlogic/api/*`.

---

## 📁 Project Structure

A standard Laravel application. The UI is a Next.js project kept under `resources/nextjs`, exported as static files into `public/`.

```
softlogic-next/
├── app/
│   ├── Console/Commands/CreateAdmin.php
│   ├── Http/Controllers/Api/      # Admin, Video, VideoView, ExamStart controllers
│   ├── Models/                    # User, Video, VideoView, ExamStart
│   ├── Providers/AppServiceProvider.php   # API rate limiters
│   └── Support/                   # ClientIp, CsvCell helpers
├── bootstrap/
├── config/
├── database/
│   ├── migrations/
│   └── seeders/                   # AdminUserSeeder, VideoSeeder (+ videos_data.json)
├── docs/                          # Deploy guide, security audit reports
├── public/                        # Web root: index.php + built Next.js site (_next/, exam/, admin/, media)
├── resources/
│   └── nextjs/                    # Next.js source (App Router)
│       ├── public/                # Awareness videos & thumbnails (copied into the export)
│       └── src/
│           ├── app/               # page.tsx, exam/, admin/, admin/login/
│           ├── components/        # VideoModal, AgeGateModal, GlitchTransition, ...
│           └── lib/               # api.ts (API client), videoData.ts
├── routes/
│   ├── api.php
│   └── web.php                    # Serves exported pages under `php artisan serve`
├── storage/
├── .htaccess                      # Hostinger: routes everything into public/
├── composer.json
└── package.json                   # build / dev scripts
```
