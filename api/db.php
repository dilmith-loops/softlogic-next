<?php
require_once __DIR__ . '/config.php';

function getDb(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $host = DB_HOST;
    $port = DB_PORT;
    $dbname = DB_NAME;
    $user = DB_USER;
    $pass = DB_PASS;

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        try {
            $rootDsn = "mysql:host={$host};port={$port};charset=utf8mb4";
            $tmp = new PDO($rootDsn, $user, $pass, $options);
            $tmp->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e2) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage()
            ]);
            exit;
        }
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `video_views` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `video_id` VARCHAR(191) NOT NULL,
            `video_title` VARCHAR(255) NULL,
            `video_src` VARCHAR(255) NULL,
            `ip_address` VARCHAR(45) NOT NULL,
            `user_agent` TEXT NULL,
            `viewed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_video_id` (`video_id`),
            INDEX `idx_ip_address` (`ip_address`),
            INDEX `idx_viewed_at` (`viewed_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS `users` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `email` VARCHAR(191) NOT NULL UNIQUE,
            `password` VARCHAR(255) NOT NULL,
            `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
            `created_at` TIMESTAMP NULL,
            `updated_at` TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $check = $pdo->prepare("SELECT COUNT(*) FROM `users` WHERE `email` = ?");
    $check->execute(['admin@softlogic.lk']);
    if ($check->fetchColumn() == 0) {
        $insert = $pdo->prepare("INSERT INTO `users` (`name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES (?, ?, ?, 'admin', NOW(), NOW())");
        $insert->execute(['System Administrator', 'admin@softlogic.lk', password_hash('Admin@CheckHub2026', PASSWORD_BCRYPT)]);
    }

    return $pdo;
}
