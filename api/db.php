<?php
require_once __DIR__ . "/config.php";

date_default_timezone_set('Asia/Colombo');

function getDb(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $host = DB_HOST;
    $port = DB_PORT;
    $dbname = DB_NAME;
    $user = DB_USER;
    $pass = DB_PASS;

    $mysqlConnected = false;

    // 1. Attempt MySQL connection
    if ($user !== "" || $pass !== "" || $dbname !== "") {
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 2,
            ];
            $pdo = new PDO($dsn, $user, $pass, $options);
            $pdo->exec("SET time_zone = '+05:30'");
            $mysqlConnected = true;
        } catch (Throwable $e) {
            $mysqlConnected = false;
        }
    }

    // 2. Fallback to SQLite so API never crashes on unconfigured MySQL
    if (!$mysqlConnected) {
        $sqliteFile = __DIR__ . "/checkhub.sqlite";
        $pdo = new PDO("sqlite:" . $sqliteFile, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS video_views (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                video_id TEXT NOT NULL,
                video_title TEXT,
                video_src TEXT,
                ip_address TEXT NOT NULL,
                user_agent TEXT,
                viewed_at DATETIME NOT NULL
            );

            CREATE TABLE IF NOT EXISTS exam_starts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_address TEXT NOT NULL,
                user_agent TEXT,
                video_id TEXT,
                consented INTEGER NOT NULL DEFAULT 1,
                started_at DATETIME NOT NULL
            );

            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'admin',
                created_at DATETIME,
                updated_at DATETIME
            );
        ");

        $check = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $check->execute(["admin@softlogic.lk"]);
        if ($check->fetchColumn() == 0) {
            $insert = $pdo->prepare("INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, 'admin', datetime('now'), datetime('now'))");
            $insert->execute(["System Administrator", "admin@softlogic.lk", password_hash("Admin@CheckHub2026", PASSWORD_BCRYPT)]);
        }

        return $pdo;
    }

    // MySQL setup
    try {
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

            CREATE TABLE IF NOT EXISTS `exam_starts` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `ip_address` VARCHAR(45) NOT NULL,
                `user_agent` TEXT NULL,
                `video_id` VARCHAR(191) NULL,
                `consented` TINYINT(1) NOT NULL DEFAULT 1,
                `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX `idx_exam_ip` (`ip_address`),
                INDEX `idx_exam_started_at` (`started_at`)
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
        $check->execute(["admin@softlogic.lk"]);
        if ($check->fetchColumn() == 0) {
            $insert = $pdo->prepare("INSERT INTO `users` (`name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES (?, ?, ?, 'admin', NOW(), NOW())");
            $insert->execute(["System Administrator", "admin@softlogic.lk", password_hash("Admin@CheckHub2026", PASSWORD_BCRYPT)]);
        }
    } catch (Throwable $t) {
        // Table may already exist
    }

    return $pdo;
}
