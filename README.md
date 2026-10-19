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

## 🔐 Administrator Credentials

Per requirement, **no admin credentials are hardcoded or stored in `.env`**. They reside solely in MySQL:

- **Default Seeded Admin**:
  - Email: `admin@checkhub.org`
  - Password: `Admin@CheckHub2026!`
- **CLI Artisan Command to Create/Reset Admins**:
  ```bash
  cd backend
  php artisan app:create-admin
  # Or non-interactively:
  php artisan app:create-admin --name="Security Admin" --email="it@checkhub.org" --password="YourSecurePassword123"
  ```
- **Web UI Admin Creation**:
  - Authenticated administrators can click `+ Add Admin (DB)` in `/admin` to insert additional admins directly into the database.

---

## 🚀 Getting Started

### Prerequisites
- PHP >= 8.2 with `php-mysql`, `php-pdo`, `php-curl`
- Composer 2
- MySQL Server (running locally on port 3306)
- Node.js >= 18 and npm

### 1. Database Setup
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS checkhub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Backend Setup (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Configure MySQL in .env:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=checkhub_db
# DB_USERNAME=root
# DB_PASSWORD=

# Run migrations and seed the 12 awareness videos + default admin:
php artisan migrate:fresh --seed

# Start backend server (port 8000):
php artisan serve --host=127.0.0.1 --port=8000
```

### 3. Frontend Setup (Next.js)
```bash
cd ../frontend
npm install

# Start Next.js dev server (port 3000):
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/videos` | Fetch videos with dynamic views & unique IP counts | Public |
| `GET` | `/api/videos/{id}` | Fetch single video details | Public |
| `POST` | `/api/views` | **Record video play event with user IP & timestamp** | Public |
| `POST` | `/api/admin/login` | Authenticate admin against MySQL `users` table | Public |
| `POST` | `/api/admin/logout` | Revoke admin access token | Sanctum |
| `GET` | `/api/admin/me` | Get authenticated admin profile | Sanctum |
| `GET` | `/api/admin/stats` | Overview metrics, video breakdowns, top IPs | Sanctum |
| `GET` | `/api/admin/views` | Paginated view logs with IP addresses & dates | Sanctum |
| `GET` | `/api/admin/export` | Download view records as CSV file | Sanctum |
| `POST` | `/api/admin/create-user` | Insert new administrator into MySQL `users` | Sanctum |

---

## 📁 Project Structure

```
softlogic-next/
├── backend/                  # Laravel 11 API Backend
│   ├── app/
│   │   ├── Console/Commands/CreateAdmin.php
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AdminController.php
│   │   │   ├── VideoController.php
│   │   │   └── VideoViewController.php
│   │   └── Models/
│   │       ├── User.php
│   │       ├── Video.php
│   │       └── VideoView.php
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   │       ├── AdminUserSeeder.php
│   │       ├── VideoSeeder.php
│   │       └── DatabaseSeeder.php
│   └── routes/api.php
├── frontend/                 # Next.js 15 Application
│   ├── public/               # Awareness videos & thumbnails
│   └── src/
│       ├── app/
│       │   ├── page.tsx       # Main CheckHub Portal & Video Grid
│       │   ├── layout.tsx     # Global fonts, metadata & dark theme
│       │   ├── globals.css    # Complete CheckHub design system + Admin CSS
│       │   ├── exam/page.tsx  # Guided 3-minute self-exam story experience
│       │   └── admin/
│       │       ├── page.tsx   # Admin Analytics Dashboard & IP Stream Table
│       │       └── login/page.tsx # Database Admin Authentication
│       ├── components/
│       │   ├── VideoModal.tsx # Video player dialog with automatic IP logger
│       │   ├── Header.tsx
│       │   ├── SubNav.tsx
│       │   ├── AgeGateModal.tsx
│       │   ├── GlitchTransition.tsx
│       │   ├── SelfCheckModal.tsx
│       │   ├── ReminderModal.tsx
│       │   └── ShareModal.tsx
│       └── lib/
│           ├── api.ts         # Backend API client & TypeScript interfaces
│           └── videoData.ts   # Video data models & catalog
└── README.md
```
