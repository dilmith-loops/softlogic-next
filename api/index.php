<?php
/**
 * CheckHub Hardened REST API
 * Secure implementation with Bearer Token Authentication, Rate Limiting,
 * Strict CORS, CSV Formula Injection Protection & Error Sanitization.
 */

date_default_timezone_set('Asia/Colombo');

// 1. Strict Origin-Based CORS Protection
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'https://ai.loopsintegrated.co',
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
];

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
} else {
    header("Access-Control-Allow-Origin: https://ai.loopsintegrated.co");
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json; charset=UTF-8");

// 2. Production-Safe Error Handler (Suppresses Internal Paths & Database Credentials)
register_shutdown_function(function() {
    $err = error_get_last();
    if ($err && in_array($err["type"], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        error_log("CheckHub API Fatal: {$err['message']} in {$err['file']} on line {$err['line']}");
        if (!headers_sent()) {
            http_response_code(500);
        }
        echo json_encode(["success" => false, "message" => "An internal system error occurred."]);
    }
});

try {
    require_once __DIR__ . "/db.php";
    $uri = parse_url($_SERVER["REQUEST_URI"] ?? "", PHP_URL_PATH);
    $uri = preg_replace("#^/(softlogic/)?api/?#", "", $uri);
    $method = $_SERVER["REQUEST_METHOD"] ?? "GET";

    // 3. Validated Client IP Resolution
    function getClientIp(): string {
        $ip = $_SERVER["REMOTE_ADDR"] ?? "127.0.0.1";
        if (!empty($_SERVER["HTTP_CF_CONNECTING_IP"]) && filter_var($_SERVER["HTTP_CF_CONNECTING_IP"], FILTER_VALIDATE_IP)) {
            $ip = $_SERVER["HTTP_CF_CONNECTING_IP"];
        } elseif (!empty($_SERVER["HTTP_X_FORWARDED_FOR"])) {
            $forwarded = explode(",", $_SERVER["HTTP_X_FORWARDED_FOR"])[0];
            $forwarded = trim($forwarded);
            if (filter_var($forwarded, FILTER_VALIDATE_IP)) {
                $ip = $forwarded;
            }
        }
        return substr($ip, 0, 45);
    }

    // 4. CSV Formula Injection Sanitizer
    function sanitizeCsvCell($value): string {
        $val = (string)($value ?? '');
        if ($val !== '' && in_array($val[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'" . $val; // Prepend single quote to neutralize formula execution in Excel/Calc
        }
        return $val;
    }

    // 5. Mandatory Administrator Authentication Middleware
    function requireAdminAuth(PDO $db): array {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!$authHeader && function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        if (!preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Unauthorized: Authentication token is missing or malformed."]);
            exit;
        }

        $token = trim($matches[1]);
        $sriLankaNow = date('Y-m-d H:i:s');
        $stmt = $db->prepare("
            SELECT u.id, u.name, u.email, u.role
            FROM admin_tokens t
            JOIN users u ON t.user_id = u.id
            WHERE t.token = ? AND t.expires_at > ?
            LIMIT 1
        ");
        $stmt->execute([$token, $sriLankaNow]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Unauthorized: Administrator session has expired or token is invalid."]);
            exit;
        }

        return $user;
    }

    $db = getDb();
    $sriLankaNow = date('Y-m-d H:i:s');
    $sriLankaToday = date('Y-m-d');
    $clientIp = getClientIp();

    // 6. Public Video Listing (GET /videos)
    if ($uri === "videos" || $uri === "videos/") {
        $campaignVideoUrl = "https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4";
        $knownVideos = [
            ["id" => "vid-11", "title" => "Softlogic Life: Change The Conversation — Know The Signs (B.R.S.T)", "category" => "awareness", "videoSrc" => $campaignVideoUrl],
            ["id" => "vid-1", "title" => "How To Do A Monthly Breast Self-Check (Step-by-Step)", "category" => "self-exam", "videoSrc" => $campaignVideoUrl],
            ["id" => "vid-2", "title" => "The 8 Warning Signs You Should Never Ignore", "category" => "symptoms", "videoSrc" => $campaignVideoUrl],
            ["id" => "vid-3", "title" => "What Does A Lump Actually Feel Like? (Tactile Guide)", "category" => "self-exam", "videoSrc" => $campaignVideoUrl],
            ["id" => "vid-4", "title" => "Breast Density Explained: Why It Matters For Screening", "category" => "anatomy", "videoSrc" => $campaignVideoUrl],
            ["id" => "vid-5", "title" => "Male Breast Cancer: Rare But Real (Know The Signs)", "category" => "awareness", "videoSrc" => $campaignVideoUrl],
            ["id" => "vid-6", "title" => "Mammogram 101: When To Start & What To Expect", "category" => "screening", "videoSrc" => $campaignVideoUrl],
            ["id" => "vid-7", "title" => "Deep Tissue Examination: Lying Down Position", "category" => "self-exam", "videoSrc" => $campaignVideoUrl],
            ["id" => "vid-8", "title" => "Myths Busted: Underwire Bras, Deodorant & Other Dangerous Lies", "category" => "myths", "videoSrc" => $campaignVideoUrl],
            ["id" => "vid-9", "title" => "Hard vs Soft: How To Feel The Difference On Glandular Tissue", "category" => "self-exam", "videoSrc" => $campaignVideoUrl],
            ["id" => "vid-10", "title" => "Under Pressure: Nipple Retraction & Discharge Warning", "category" => "symptoms", "videoSrc" => $campaignVideoUrl],
            ["id" => "vid-12", "title" => "Young & Active: Why It Doesn't Only Happen To Older People", "category" => "myths", "videoSrc" => $campaignVideoUrl],
        ];

        $vStats = [];
        $vbStmt = $db->query("SELECT video_id, COUNT(*) AS count FROM video_views GROUP BY video_id");
        while ($row = $vbStmt->fetch()) {
            $vStats[$row["video_id"]] = (int)$row["count"];
        }

        $res = [];
        foreach ($knownVideos as $kv) {
            $count = $vStats[$kv["id"]] ?? 0;
            $res[] = array_merge($kv, [
                "views" => $count . " views",
                "viewsCount" => $count
            ]);
        }

        echo json_encode([
            "success" => true,
            "data" => $res
        ]);
        exit;
    }

    // 7. Record Video View (POST /views) - Rate limited against flooding
    if (($uri === "views" || $uri === "views/") && $method === "POST") {
        $raw = file_get_contents("php://input");
        $input = json_decode($raw, true) ?: [];
        $videoId = substr(trim($input["video_id"] ?? ""), 0, 100);
        $videoTitle = substr(trim($input["video_title"] ?? ""), 0, 255);
        $videoSrc = substr(trim($input["video_src"] ?? ""), 0, 255);
        $userAgent = substr($_SERVER["HTTP_USER_AGENT"] ?? "", 0, 500);

        if (!$videoId) {
            http_response_code(422);
            echo json_encode(["success" => false, "message" => "video_id is required"]);
            exit;
        }

        // Rate Limit: Prevent same IP recording > 30 views in 60 seconds
        $rateStmt = $db->prepare("SELECT COUNT(*) FROM video_views WHERE ip_address = ? AND viewed_at >= ?");
        $oneMinuteAgo = date('Y-m-d H:i:s', time() - 60);
        $rateStmt->execute([$clientIp, $oneMinuteAgo]);
        if ((int)$rateStmt->fetchColumn() > 30) {
            http_response_code(429);
            echo json_encode(["success" => false, "message" => "Rate limit exceeded. Please wait a moment."]);
            exit;
        }

        $stmt = $db->prepare("INSERT INTO video_views (video_id, video_title, video_src, ip_address, user_agent, viewed_at) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$videoId, $videoTitle, $videoSrc, $clientIp, $userAgent ?: null, $sriLankaNow]);
        $viewId = (int)$db->lastInsertId();

        $cStmt = $db->prepare("SELECT COUNT(*) AS total_views, COUNT(DISTINCT ip_address) AS unique_ips FROM video_views WHERE video_id = ?");
        $cStmt->execute([$videoId]);
        $counts = $cStmt->fetch();

        echo json_encode([
            "success" => true,
            "message" => "Video playback view recorded successfully",
            "data" => [
                "view_id" => $viewId,
                "video_id" => $videoId,
                "video_title" => $videoTitle,
                "ip_address" => $clientIp,
                "viewed_at" => $sriLankaNow,
                "formatted_date" => date("M d, Y h:i:s A") . " (SLST)",
                "total_views" => (int)($counts["total_views"] ?? 1),
                "unique_ips" => (int)($counts["unique_ips"] ?? 1),
            ]
        ]);
        exit;
    }

    // 8. Record Exam Start (POST /exam-starts) - User consent tracking
    if (($uri === "exam-starts" || $uri === "exam-starts/" || $uri === "exam/start") && $method === "POST") {
        $raw = file_get_contents("php://input");
        $input = json_decode($raw, true) ?: [];
        $videoId = substr(trim($input["video_id"] ?? ""), 0, 100);
        $userAgent = substr($_SERVER["HTTP_USER_AGENT"] ?? "", 0, 500);

        // Rate Limit: Prevent same IP recording > 10 exam starts in 60 seconds
        $rateStmt = $db->prepare("SELECT COUNT(*) FROM exam_starts WHERE ip_address = ? AND started_at >= ?");
        $oneMinuteAgo = date('Y-m-d H:i:s', time() - 60);
        $rateStmt->execute([$clientIp, $oneMinuteAgo]);
        if ((int)$rateStmt->fetchColumn() > 10) {
            http_response_code(429);
            echo json_encode(["success" => false, "message" => "Rate limit exceeded. Please wait a moment."]);
            exit;
        }

        $stmt = $db->prepare("INSERT INTO exam_starts (ip_address, user_agent, video_id, consented, started_at) VALUES (?, ?, ?, 1, ?)");
        $stmt->execute([$clientIp, $userAgent ?: null, $videoId ?: null, $sriLankaNow]);
        $startId = (int)$db->lastInsertId();

        $totalExamStarts = (int)$db->query("SELECT COUNT(*) FROM exam_starts")->fetchColumn();
        $uniqueExamIps = (int)$db->query("SELECT COUNT(DISTINCT ip_address) FROM exam_starts")->fetchColumn();

        echo json_encode([
            "success" => true,
            "message" => "Consented examination start recorded successfully",
            "data" => [
                "id" => $startId,
                "ip_address" => $clientIp,
                "started_at" => $sriLankaNow,
                "formatted_date" => date("M d, Y h:i:s A") . " (SLST)",
                "total_exam_starts" => $totalExamStarts,
                "unique_exam_ips" => $uniqueExamIps,
            ]
        ]);
        exit;
    }

    // 9. Admin Login (POST /admin/login) - Rate-limited against brute force
    if ($uri === "admin/login" && $method === "POST") {
        $fifteenMinutesAgo = date('Y-m-d H:i:s', time() - 900);

        // Check failed attempts from this IP in the last 15 minutes
        $attStmt = $db->prepare("SELECT COUNT(*) FROM login_attempts WHERE ip_address = ? AND attempted_at >= ?");
        $attStmt->execute([$clientIp, $fifteenMinutesAgo]);
        $failedAttempts = (int)$attStmt->fetchColumn();

        if ($failedAttempts >= 5) {
            http_response_code(429);
            echo json_encode([
                "success" => false,
                "message" => "Account temporarily locked due to excessive failed attempts. Please wait 15 minutes."
            ]);
            exit;
        }

        $raw = file_get_contents("php://input");
        $input = json_decode($raw, true) ?: [];
        $email = trim($input["email"] ?? "");
        $password = trim($input["password"] ?? "");

        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user["password"])) {
            // Record failed attempt
            $insAtt = $db->prepare("INSERT INTO login_attempts (ip_address, attempted_at) VALUES (?, ?)");
            $insAtt->execute([$clientIp, $sriLankaNow]);

            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Invalid email or password."]);
            exit;
        }

        // Login succeeded: Clear login attempts for this IP
        $clrAtt = $db->prepare("DELETE FROM login_attempts WHERE ip_address = ?");
        $clrAtt->execute([$clientIp]);

        // Generate cryptographically secure bearer token
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + (86400 * 7)); // 7 days expiration

        $tStmt = $db->prepare("INSERT INTO admin_tokens (user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?)");
        $tStmt->execute([$user["id"], $token, $sriLankaNow, $expiresAt]);

        echo json_encode([
            "success" => true,
            "message" => "Admin authentication successful",
            "data" => [
                "token" => $token,
                "user" => [
                    "id" => (int)$user["id"],
                    "name" => $user["name"],
                    "email" => $user["email"],
                    "role" => $user["role"],
                ]
            ]
        ]);
        exit;
    }

    // 10. Admin Logout (POST /admin/logout)
    if ($uri === "admin/logout" && $method === "POST") {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
            $delStmt = $db->prepare("DELETE FROM admin_tokens WHERE token = ?");
            $delStmt->execute([trim($matches[1])]);
        }
        echo json_encode(["success" => true, "message" => "Logged out successfully"]);
        exit;
    }

    // 11. Admin Overview Stats (GET /admin/stats) - Strictly Protected
    if ($uri === "admin/stats" && $method === "GET") {
        requireAdminAuth($db);

        $totalViews = (int)$db->query("SELECT COUNT(*) FROM video_views")->fetchColumn();
        $uniqueIps = (int)$db->query("SELECT COUNT(DISTINCT ip_address) FROM video_views")->fetchColumn();

        $todayViewsStmt = $db->prepare("SELECT COUNT(*) FROM video_views WHERE DATE(viewed_at) = ?");
        $todayViewsStmt->execute([$sriLankaToday]);
        $todayViews = (int)$todayViewsStmt->fetchColumn();

        $totalExamStarts = 0;
        $todayExamStarts = 0;
        $uniqueExamIps = 0;
        try {
            $totalExamStarts = (int)$db->query("SELECT COUNT(*) FROM exam_starts")->fetchColumn();
            $uniqueExamIps = (int)$db->query("SELECT COUNT(DISTINCT ip_address) FROM exam_starts")->fetchColumn();
            $eTodayStmt = $db->prepare("SELECT COUNT(*) FROM exam_starts WHERE DATE(started_at) = ?");
            $eTodayStmt->execute([$sriLankaToday]);
            $todayExamStarts = (int)$eTodayStmt->fetchColumn();
        } catch (Throwable $t) {}

        $knownVideos = [
            ["id" => "vid-11", "title" => "Morning Routine: 3 Minutes That Could Save Your Life", "category" => "self-exam"],
            ["id" => "vid-1", "title" => "How To Do A Monthly Breast Self-Check (Step-by-Step)", "category" => "self-exam"],
            ["id" => "vid-2", "title" => "The 8 Warning Signs You Should Never Ignore", "category" => "symptoms"],
            ["id" => "vid-3", "title" => "What Does A Lump Actually Feel Like? (Tactile Guide)", "category" => "self-exam"],
            ["id" => "vid-4", "title" => "Breast Density Explained: Why It Matters For Screening", "category" => "anatomy"],
            ["id" => "vid-5", "title" => "Male Breast Cancer: Rare But Real (Know The Signs)", "category" => "awareness"],
            ["id" => "vid-6", "title" => "Mammogram 101: When To Start & What To Expect", "category" => "screening"],
            ["id" => "vid-7", "title" => "Deep Tissue Examination: Lying Down Position", "category" => "self-exam"],
            ["id" => "vid-8", "title" => "Myths Busted: Underwire Bras, Deodorant & Other Dangerous Lies", "category" => "myths"],
            ["id" => "vid-9", "title" => "Hard vs Soft: How To Feel The Difference On Glandular Tissue", "category" => "self-exam"],
            ["id" => "vid-10", "title" => "Under Pressure: Nipple Retraction & Discharge Warning", "category" => "symptoms"],
            ["id" => "vid-12", "title" => "Young & Active: Why It Doesn't Only Happen To Older People", "category" => "myths"],
        ];

        $vStats = [];
        $vbStmt = $db->query("SELECT video_id, COUNT(*) AS real_recorded_views, COUNT(DISTINCT ip_address) AS unique_ips, MAX(viewed_at) AS last_viewed_at FROM video_views GROUP BY video_id");
        while ($row = $vbStmt->fetch()) {
            $vStats[$row["video_id"]] = $row;
        }

        $videosBreakdown = [];
        foreach ($knownVideos as $kv) {
            $vid = $kv["id"];
            $rec = $vStats[$vid] ?? null;
            $videosBreakdown[] = [
                "id" => $vid,
                "title" => $kv["title"],
                "category" => $kv["category"],
                "real_recorded_views" => (int)($rec["real_recorded_views"] ?? 0),
                "unique_ips" => (int)($rec["unique_ips"] ?? 0),
                "last_viewed_at" => $rec["last_viewed_at"] ?? "Never",
            ];
        }

        $topIps = $db->query("SELECT ip_address, COUNT(*) AS total_views, COUNT(DISTINCT video_id) AS unique_videos, MIN(viewed_at) AS first_seen, MAX(viewed_at) AS last_seen FROM video_views GROUP BY ip_address ORDER BY total_views DESC LIMIT 15")->fetchAll();

        echo json_encode([
            "success" => true,
            "data" => [
                "overview" => [
                    "real_views_recorded" => $totalViews,
                    "grand_total_views" => $totalViews,
                    "unique_ips" => $uniqueIps,
                    "today_views" => $todayViews,
                    "total_videos" => count($knownVideos),
                    "total_exam_starts" => $totalExamStarts,
                    "today_exam_starts" => $todayExamStarts,
                    "unique_exam_ips" => $uniqueExamIps,
                ],
                "videos_breakdown" => $videosBreakdown,
                "top_ips" => $topIps,
                "daily_activity" => [],
            ]
        ]);
        exit;
    }

    // 12. Admin Views Log (GET /admin/views) - Strictly Protected
    if ($uri === "admin/views" && $method === "GET") {
        requireAdminAuth($db);

        $search = trim($_GET["search"] ?? "");
        $videoId = trim($_GET["video_id"] ?? "");
        $dateFrom = trim($_GET["date_from"] ?? "");
        $dateTo = trim($_GET["date_to"] ?? "");
        $page = max(1, (int)($_GET["page"] ?? 1));
        $perPage = min(100, max(5, (int)($_GET["per_page"] ?? 25)));
        $offset = ($page - 1) * $perPage;

        $where = ["1=1"];
        $params = [];

        if ($search !== "") {
            $where[] = "ip_address LIKE ?";
            $params[] = "%{$search}%";
        }
        if ($videoId !== "" && $videoId !== "all") {
            $where[] = "video_id = ?";
            $params[] = $videoId;
        }
        if ($dateFrom !== "") {
            $where[] = "DATE(viewed_at) >= ?";
            $params[] = $dateFrom;
        }
        if ($dateTo !== "") {
            $where[] = "DATE(viewed_at) <= ?";
            $params[] = $dateTo;
        }

        $whereSql = implode(" AND ", $where);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM video_views WHERE {$whereSql}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $db->prepare("SELECT id, video_id, video_title, video_src, ip_address, user_agent, viewed_at FROM video_views WHERE {$whereSql} ORDER BY id DESC LIMIT {$perPage} OFFSET {$offset}");
        $stmt->execute($params);
        $logs = $stmt->fetchAll();

        echo json_encode([
            "success" => true,
            "data" => $logs,
            "pagination" => [
                "current_page" => $page,
                "last_page" => (int)ceil($total / $perPage) ?: 1,
                "per_page" => $perPage,
                "total" => $total,
            ]
        ]);
        exit;
    }

    // 13. Admin Exam Starts Log (GET /admin/exam-starts) - Strictly Protected
    if ($uri === "admin/exam-starts" && $method === "GET") {
        requireAdminAuth($db);

        $page = max(1, (int)($_GET["page"] ?? 1));
        $perPage = min(100, max(5, (int)($_GET["per_page"] ?? 25)));
        $offset = ($page - 1) * $perPage;

        $total = (int)$db->query("SELECT COUNT(*) FROM exam_starts")->fetchColumn();
        $stmt = $db->query("SELECT id, ip_address, user_agent, video_id, consented, started_at FROM exam_starts ORDER BY id DESC LIMIT {$perPage} OFFSET {$offset}");
        $logs = $stmt->fetchAll();

        echo json_encode([
            "success" => true,
            "data" => $logs,
            "pagination" => [
                "current_page" => $page,
                "last_page" => (int)ceil($total / $perPage) ?: 1,
                "per_page" => $perPage,
                "total" => $total,
            ]
        ]);
        exit;
    }

    // 14. Add New Admin (POST /admin/users) - Strictly Protected with Validation
    if ($uri === "admin/users" && $method === "POST") {
        requireAdminAuth($db);

        $raw = file_get_contents("php://input");
        $input = json_decode($raw, true) ?: [];
        $name = trim($input["name"] ?? "");
        $email = trim($input["email"] ?? "");
        $password = trim($input["password"] ?? "");

        if (strlen($name) < 2 || strlen($name) > 100) {
            http_response_code(422);
            echo json_encode(["success" => false, "message" => "Name must be between 2 and 100 characters."]);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(422);
            echo json_encode(["success" => false, "message" => "A valid email address is required."]);
            exit;
        }

        if (strlen($password) < 8) {
            http_response_code(422);
            echo json_encode(["success" => false, "message" => "Password must be at least 8 characters long."]);
            exit;
        }

        $check = $db->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "Admin email already exists in database."]);
            exit;
        }

        $stmt = $db->prepare("INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, 'admin', ?, ?)");
        $stmt->execute([$name, $email, password_hash($password, PASSWORD_BCRYPT), $sriLankaNow, $sriLankaNow]);

        echo json_encode([
            "success" => true,
            "message" => "New administrator created successfully."
        ]);
        exit;
    }

    // 15. Update Admin Profile (POST /admin/profile) - Protected + IDOR Prevention
    if (($uri === "admin/profile" || $uri === "admin/profile/") && $method === "POST") {
        $authUser = requireAdminAuth($db);
        $userId = (int)$authUser["id"]; // Strictly enforce authenticated user ID to prevent IDOR

        $raw = file_get_contents("php://input");
        $input = json_decode($raw, true) ?: [];
        $name = trim($input["name"] ?? "");
        $email = trim($input["email"] ?? "");
        $password = trim($input["password"] ?? "");

        if (strlen($name) < 2 || strlen($name) > 100) {
            http_response_code(422);
            echo json_encode(["success" => false, "message" => "Name must be between 2 and 100 characters."]);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(422);
            echo json_encode(["success" => false, "message" => "A valid email address is required."]);
            exit;
        }

        $check = $db->prepare("SELECT COUNT(*) FROM users WHERE email = ? AND id != ?");
        $check->execute([$email, $userId]);
        if ($check->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "Email address is already in use by another account."]);
            exit;
        }

        if ($password !== "") {
            if (strlen($password) < 8) {
                http_response_code(422);
                echo json_encode(["success" => false, "message" => "New password must be at least 8 characters long."]);
                exit;
            }
            $hashed = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $db->prepare("UPDATE users SET name = ?, email = ?, password = ?, updated_at = ? WHERE id = ?");
            $stmt->execute([$name, $email, $hashed, $sriLankaNow, $userId]);
        } else {
            $stmt = $db->prepare("UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?");
            $stmt->execute([$name, $email, $sriLankaNow, $userId]);
        }

        $stmt = $db->prepare("SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $updatedUser = $stmt->fetch();

        echo json_encode([
            "success" => true,
            "message" => "Administrator profile updated successfully.",
            "data" => [
                "user" => [
                    "id" => (int)$updatedUser["id"],
                    "name" => $updatedUser["name"],
                    "email" => $updatedUser["email"],
                    "role" => $updatedUser["role"],
                ]
            ]
        ]);
        exit;
    }

    // 16. Admin Export CSV (GET /admin/export) - Protected + Formula Injection Protection
    if ($uri === "admin/export" && $method === "GET") {
        requireAdminAuth($db);

        $type = $_GET["type"] ?? "views";
        if ($type === "exam") {
            header("Content-Type: text/csv; charset=UTF-8");
            header("Content-Disposition: attachment; filename=\"checkhub_exam_starts_" . date("Y-m-d") . ".csv\"");
            $out = fopen("php://output", "w");
            fputcsv($out, ["ID", "IP Address", "User Agent", "Video ID", "Consented", "Started At (SLST)"]);
            $q = $db->query("SELECT id, ip_address, user_agent, video_id, consented, started_at FROM exam_starts ORDER BY id DESC");
            while ($r = $q->fetch()) {
                fputcsv($out, [
                    $r["id"],
                    sanitizeCsvCell($r["ip_address"]),
                    sanitizeCsvCell($r["user_agent"]),
                    sanitizeCsvCell($r["video_id"]),
                    $r["consented"],
                    sanitizeCsvCell($r["started_at"])
                ]);
            }
            fclose($out);
            exit;
        }

        header("Content-Type: text/csv; charset=UTF-8");
        header("Content-Disposition: attachment; filename=\"checkhub_video_views_" . date("Y-m-d") . ".csv\"");
        $out = fopen("php://output", "w");
        fputcsv($out, ["ID", "Video ID", "Video Title", "IP Address", "User Agent", "Viewed At (SLST)"]);
        $q = $db->query("SELECT id, video_id, video_title, ip_address, user_agent, viewed_at FROM video_views ORDER BY id DESC");
        while ($r = $q->fetch()) {
            fputcsv($out, [
                $r["id"],
                sanitizeCsvCell($r["video_id"]),
                sanitizeCsvCell($r["video_title"]),
                sanitizeCsvCell($r["ip_address"]),
                sanitizeCsvCell($r["user_agent"]),
                sanitizeCsvCell($r["viewed_at"])
            ]);
        }
        fclose($out);
        exit;
    }

    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Endpoint not found: {$uri}"]);
} catch (Throwable $e) {
    error_log("CheckHub API Exception: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "A server error occurred. Please contact the administrator."
    ]);
}
