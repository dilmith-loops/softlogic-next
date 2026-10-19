<?php
date_default_timezone_set('Asia/Colombo');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Accept");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json; charset=UTF-8");

// Catch fatal errors and always return JSON
register_shutdown_function(function() {
    $err = error_get_last();
    if ($err && in_array($err["type"], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        echo json_encode(["success" => false, "fatal" => $err["message"] . " on line " . $err["line"]]);
    }
});

try {
    require_once __DIR__ . "/db.php";
    $uri = parse_url($_SERVER["REQUEST_URI"] ?? "", PHP_URL_PATH);
    $uri = preg_replace("#^/(softlogic/)?api/?#", "", $uri);
    $method = $_SERVER["REQUEST_METHOD"] ?? "GET";

    function getClientIp(): string {
        if (!empty($_SERVER["HTTP_CF_CONNECTING_IP"])) return $_SERVER["HTTP_CF_CONNECTING_IP"];
        if (!empty($_SERVER["HTTP_X_FORWARDED_FOR"])) {
            $ips = explode(",", $_SERVER["HTTP_X_FORWARDED_FOR"]);
            return trim($ips[0]);
        }
        return $_SERVER["REMOTE_ADDR"] ?? "127.0.0.1";
    }

    $db = getDb();
    $sriLankaNow = date('Y-m-d H:i:s');
    $sriLankaToday = date('Y-m-d');

    // 1. Record Video View (POST /views) - ONLY called when user plays a video
    if (($uri === "views" || $uri === "views/") && $method === "POST") {
        $raw = file_get_contents("php://input");
        $input = json_decode($raw, true) ?: [];
        $videoId = trim($input["video_id"] ?? "");
        $videoTitle = trim($input["video_title"] ?? "");
        $videoSrc = trim($input["video_src"] ?? "");
        $ip = getClientIp();
        $userAgent = $_SERVER["HTTP_USER_AGENT"] ?? null;

        if (!$videoId) {
            http_response_code(422);
            echo json_encode(["success" => false, "message" => "video_id is required"]);
            exit;
        }

        $stmt = $db->prepare("INSERT INTO video_views (video_id, video_title, video_src, ip_address, user_agent, viewed_at) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$videoId, $videoTitle, $videoSrc, $ip, $userAgent, $sriLankaNow]);
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
                "ip_address" => $ip,
                "viewed_at" => $sriLankaNow,
                "formatted_date" => date("M d, Y h:i:s A") . " (SLST)",
                "total_views" => (int)($counts["total_views"] ?? 1),
                "unique_ips" => (int)($counts["unique_ips"] ?? 1),
            ]
        ]);
        exit;
    }

    // 2. Record Exam Start (POST /exam-starts) - User checked consent checkbox and clicked start exam
    if (($uri === "exam-starts" || $uri === "exam-starts/" || $uri === "exam/start") && $method === "POST") {
        $raw = file_get_contents("php://input");
        $input = json_decode($raw, true) ?: [];
        $videoId = trim($input["video_id"] ?? "");
        $ip = getClientIp();
        $userAgent = $_SERVER["HTTP_USER_AGENT"] ?? null;

        $stmt = $db->prepare("INSERT INTO exam_starts (ip_address, user_agent, video_id, consented, started_at) VALUES (?, ?, ?, 1, ?)");
        $stmt->execute([$ip, $userAgent, $videoId ?: null, $sriLankaNow]);
        $startId = (int)$db->lastInsertId();

        $totalExamStarts = (int)$db->query("SELECT COUNT(*) FROM exam_starts")->fetchColumn();
        $uniqueExamIps = (int)$db->query("SELECT COUNT(DISTINCT ip_address) FROM exam_starts")->fetchColumn();

        echo json_encode([
            "success" => true,
            "message" => "Consented examination start recorded successfully",
            "data" => [
                "id" => $startId,
                "ip_address" => $ip,
                "started_at" => $sriLankaNow,
                "formatted_date" => date("M d, Y h:i:s A") . " (SLST)",
                "total_exam_starts" => $totalExamStarts,
                "unique_exam_ips" => $uniqueExamIps,
            ]
        ]);
        exit;
    }

    // 3. Admin Login (POST /admin/login)
    if ($uri === "admin/login" && $method === "POST") {
        $raw = file_get_contents("php://input");
        $input = json_decode($raw, true) ?: [];
        $email = trim($input["email"] ?? "");
        $password = trim($input["password"] ?? "");

        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user["password"])) {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Invalid email or password"]);
            exit;
        }

        $token = bin2hex(random_bytes(32));

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

    // 4. Admin Overview Stats (GET /admin/stats) - Real data only!
    if ($uri === "admin/stats" && $method === "GET") {
        $totalViews = (int)$db->query("SELECT COUNT(*) FROM video_views")->fetchColumn();
        $uniqueIps = (int)$db->query("SELECT COUNT(DISTINCT ip_address) FROM video_views")->fetchColumn();

        $todayViewsStmt = $db->prepare("SELECT COUNT(*) FROM video_views WHERE DATE(viewed_at) = ?");
        $todayViewsStmt->execute([$sriLankaToday]);
        $todayViews = (int)$todayViewsStmt->fetchColumn();

        // Exam Starts
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

        // Known Videos list
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
                    "grand_total_views" => $totalViews, // Real only! No fake multiplier
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

    // 5. Admin Views Log (GET /admin/views)
    if ($uri === "admin/views" && $method === "GET") {
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

    // 6. Admin Exam Starts Log (GET /admin/exam-starts)
    if ($uri === "admin/exam-starts" && $method === "GET") {
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

    // 7. Add New Admin (POST /admin/users)
    if ($uri === "admin/users" && $method === "POST") {
        $raw = file_get_contents("php://input");
        $input = json_decode($raw, true) ?: [];
        $name = trim($input["name"] ?? "");
        $email = trim($input["email"] ?? "");
        $password = trim($input["password"] ?? "");

        if (!$name || !$email || !$password) {
            http_response_code(422);
            echo json_encode(["success" => false, "message" => "Name, email and password are required"]);
            exit;
        }

        $check = $db->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "Admin email already exists in database"]);
            exit;
        }

        $stmt = $db->prepare("INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, 'admin', ?, ?)");
        $stmt->execute([$name, $email, password_hash($password, PASSWORD_BCRYPT), $sriLankaNow, $sriLankaNow]);

        echo json_encode([
            "success" => true,
            "message" => "New administrator created successfully in MySQL database"
        ]);
        exit;
    }

    // 8. Admin Export CSV (GET /admin/export)
    if ($uri === "admin/export" && $method === "GET") {
        $type = $_GET["type"] ?? "views";
        if ($type === "exam") {
            header("Content-Type: text/csv");
            header("Content-Disposition: attachment; filename=\"checkhub_exam_starts_" . date("Y-m-d") . ".csv\"");
            $out = fopen("php://output", "w");
            fputcsv($out, ["ID", "IP Address", "User Agent", "Video ID", "Consented", "Started At (SLST)"]);
            $q = $db->query("SELECT id, ip_address, user_agent, video_id, consented, started_at FROM exam_starts ORDER BY id DESC");
            while ($r = $q->fetch()) {
                fputcsv($out, [$r["id"], $r["ip_address"], $r["user_agent"], $r["video_id"], $r["consented"], $r["started_at"]]);
            }
            fclose($out);
            exit;
        }

        header("Content-Type: text/csv");
        header("Content-Disposition: attachment; filename=\"checkhub_video_views_" . date("Y-m-d") . ".csv\"");
        $out = fopen("php://output", "w");
        fputcsv($out, ["ID", "Video ID", "Video Title", "IP Address", "User Agent", "Viewed At (SLST)"]);
        $q = $db->query("SELECT id, video_id, video_title, ip_address, user_agent, viewed_at FROM video_views ORDER BY id DESC");
        while ($r = $q->fetch()) {
            fputcsv($out, [$r["id"], $r["video_id"], $r["video_title"], $r["ip_address"], $r["user_agent"], $r["viewed_at"]]);
        }
        fclose($out);
        exit;
    }

    // 9. Video Listing (GET /videos) - Return real views for each video
    if ($uri === "videos" || $uri === "videos/") {
        $knownVideos = [
            ["id" => "vid-11", "title" => "Morning Routine: 3 Minutes That Could Save Your Life", "category" => "self-exam", "videoSrc" => "breast_cancer_awareness.mp4"],
            ["id" => "vid-1", "title" => "How To Do A Monthly Breast Self-Check (Step-by-Step)", "category" => "self-exam", "videoSrc" => "breast_cancer_awareness.mp4"],
            ["id" => "vid-2", "title" => "The 8 Warning Signs You Should Never Ignore", "category" => "symptoms", "videoSrc" => "breast_cancer_awareness.mp4"],
            ["id" => "vid-3", "title" => "What Does A Lump Actually Feel Like? (Tactile Guide)", "category" => "self-exam", "videoSrc" => "breast_cancer_awareness.mp4"],
            ["id" => "vid-4", "title" => "Breast Density Explained: Why It Matters For Screening", "category" => "anatomy", "videoSrc" => "breast_cancer_awareness.mp4"],
            ["id" => "vid-5", "title" => "Male Breast Cancer: Rare But Real (Know The Signs)", "category" => "awareness", "videoSrc" => "breast_cancer_awareness.mp4"],
            ["id" => "vid-6", "title" => "Mammogram 101: When To Start & What To Expect", "category" => "screening", "videoSrc" => "breast_cancer_awareness.mp4"],
            ["id" => "vid-7", "title" => "Deep Tissue Examination: Lying Down Position", "category" => "self-exam", "videoSrc" => "breast_cancer_awareness.mp4"],
            ["id" => "vid-8", "title" => "Myths Busted: Underwire Bras, Deodorant & Other Dangerous Lies", "category" => "myths", "videoSrc" => "breast_cancer_awareness.mp4"],
            ["id" => "vid-9", "title" => "Hard vs Soft: How To Feel The Difference On Glandular Tissue", "category" => "self-exam", "videoSrc" => "breast_cancer_awareness.mp4"],
            ["id" => "vid-10", "title" => "Under Pressure: Nipple Retraction & Discharge Warning", "category" => "symptoms", "videoSrc" => "breast_cancer_awareness.mp4"],
            ["id" => "vid-12", "title" => "Young & Active: Why It Doesn't Only Happen To Older People", "category" => "myths", "videoSrc" => "breast_cancer_awareness.mp4"],
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

    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Endpoint not found: {$uri}"]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
