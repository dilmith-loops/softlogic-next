<?php

/**
 * CheckHub - Subfolder deployment root loader
 *
 * Ensures Apache/LiteSpeed DirectoryIndex finds an index file at the site root,
 * immediately serving the static Next.js homepage or delegating to Laravel.
 */
if (file_exists(__DIR__ . '/public/index.html')) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile(__DIR__ . '/public/index.html');
    exit;
}

require_once __DIR__ . '/public/index.php';
