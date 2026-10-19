<?php
/**
 * CheckHub Database Configuration for Hostinger hPanel & Local Development
 */

date_default_timezone_set('Asia/Colombo');

if (file_exists(__DIR__ . "/../.env")) {
    $lines = file(__DIR__ . "/../.env", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === "" || str_starts_with($line, "#")) continue;
        if (str_contains($line, "=")) {
            [$key, $val] = explode("=", $line, 2);
            $key = trim($key);
            $val = trim($val, " \t\n\r\0\x0B\"\x27");
            if (!getenv($key)) {
                putenv("{$key}={$val}");
            }
        }
    }
}

define("DB_HOST", getenv("DB_HOST") ?: "127.0.0.1");
define("DB_PORT", getenv("DB_PORT") ?: "3306");
define("DB_NAME", getenv("DB_DATABASE") ?: "checkhub_db");
define("DB_USER", getenv("DB_USERNAME") ?: "root");
define("DB_PASS", getenv("DB_PASSWORD") !== false ? getenv("DB_PASSWORD") : "");
