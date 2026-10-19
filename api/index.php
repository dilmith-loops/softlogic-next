<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/db.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#^/(softlogic/)?api/?#', '', $uri);
$method = $_SERVER['REQUEST_METHOD'];

function getClientIp(): string {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) return $_SERVER['HTTP_CF_CONNECTING_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

try {
    $db = getDb();

    // 1. Record Video View (POST /views)
    if (($uri === 'views' || $uri === 'views/') && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $videoId = trim($input['video_id'] ?? '');
        $videoTitle = trim($input['video_title'] ?? '');
        $videoSrc = trim($input['video_src'] ?? '');
        $ip = getClientIp();
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

        if (!$videoId) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'video_id is required']);
            exit;
        }

        $stmt = $db->prepare("INSERT INTO `video_views` (`video_id`, `video_title`, `video_src`, `ip_address`, `user_agent`, `viewed_at`) VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$videoId, $videoTitle, $videoSrc, $ip, $userAgent]);
        $viewId = (int)$db->lastInsertId();

        $cStmt = $db->prepare("SELECT COUNT(*) AS total_views, COUNT(DISTINCT `ip_address`) AS unique_ips FROM `video_views` WHERE `video_id` = ?");
        $cStmt->execute([$videoId]);
        $counts = $cStmt->fetch();

        echo json_encode([
            'success' => true,
            'message' => 'View recorded successfully in MySQL',
            'data' => [
                'view_id' => $viewId,
                'video_id' => $videoId,
                'video_title' => $videoTitle,
                'ip_address' => $ip,
                'viewed_at' => date('Y-m-d H:i:s'),
                'formatted_date' => date('M d, Y h:i A'),
                'total_views' => (int)($counts['total_views'] ?? 1),
                'unique_ips' => (int)($counts['unique_ips'] ?? 1),
            ]
        ]);
        exit;
    }

    // 2. Admin Login (POST /admin/login)
    if ($uri === 'admin/login' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        $stmt = $db->prepare("SELECT * FROM `users` WHERE `email` = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
            exit;
        }

        $token = bin2hex(random_bytes(32));

        echo json_encode([
            'success' => true,
            'message' => 'Admin authentication successful',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => (int)$user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                ]
            ]
        ]);
        exit;
    }

    // 3. Admin Overview Stats (GET /admin/stats)
    if ($uri === 'admin/stats' && $method === 'GET') {
        $totalViews = (int)$db->query("SELECT COUNT(*) FROM `video_views`")->fetchColumn();
        $uniqueIps = (int)$db->query("SELECT COUNT(DISTINCT `ip_address`) FROM `video_views`")->fetchColumn();
        $todayViews = (int)$db->query("SELECT COUNT(*) FROM `video_views` WHERE DATE(`viewed_at`) = CURDATE()")->fetchColumn();

        $topIps = $db->query("SELECT `ip_address`, COUNT(*) AS total_views, COUNT(DISTINCT `video_id`) AS unique_videos, MIN(`viewed_at`) AS first_seen, MAX(`viewed_at`) AS last_seen FROM `video_views` GROUP BY `ip_address` ORDER BY total_views DESC LIMIT 10")->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => [
                'overview' => [
                    'real_views_recorded' => $totalViews,
                    'grand_total_views' => $totalViews + 124000,
                    'unique_ips' => $uniqueIps,
                    'today_views' => $todayViews,
                    'total_videos' => 12,
                ],
                'videos_breakdown' => [],
                'top_ips' => $topIps,
                'daily_activity' => [],
            ]
        ]);
        exit;
    }

    // 4. Admin Views Log (GET /admin/views)
    if ($uri === 'admin/views' && $method === 'GET') {
        $stmt = $db->query("SELECT `id`, `video_id`, `video_title`, `video_src`, `ip_address`, `user_agent`, `viewed_at` FROM `video_views` ORDER BY `id` DESC LIMIT 100");
        $logs = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $logs,
            'pagination' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 100,
                'total' => count($logs),
            ]
        ]);
        exit;
    }

    // 5. Video Listing Fallback (GET /videos)
    if ($uri === 'videos' || $uri === 'videos/') {
        echo json_encode([
            'success' => true,
            'data' => []
        ]);
        exit;
    }

    // Fallback 404
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => "Endpoint not found: {$uri}"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
