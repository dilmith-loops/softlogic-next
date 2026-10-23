<?php
/**
 * Local Development Server Router for CheckHub
 * Routes API requests to /api/index.php and serves static assets.
 */
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route /softlogic/api/* or /api/* to api/index.php
if (preg_match('#^/(softlogic/)?api(/.*)?$#', $uri)) {
    require __DIR__ . '/api/index.php';
    return;
}

// Serve existing static files
$filePath = __DIR__ . $uri;
if ($uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    return false; // Built-in web server serves the requested resource as-is
}

// Subdirectory index.html fallbacks
if (file_exists($filePath . '/index.html')) {
    require $filePath . '/index.html';
    return;
}

// Fallback to root index.html
if (file_exists(__DIR__ . '/index.html')) {
    require __DIR__ . '/index.html';
    return;
}

return false;
