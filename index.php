<?php
/**
 * CheckHub Entry Point for Hostinger LiteSpeed & Apache
 * Automatically serves the compiled CheckHub application when visiting /softlogic/
 */
$indexPath = __DIR__ . '/index.html';

if (file_exists($indexPath)) {
    header('Content-Type: text/html; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    readfile($indexPath);
    exit;
}

http_response_code(404);
echo "CheckHub index.html not found in " . __DIR__;
