<?php
/**
 * Image Upload API
 * POST   /api/upload             → single image upload (auth)
 * POST   /api/upload/multiple    → multiple images upload (auth)
 * DELETE /api/upload/{filename}  → delete image (auth)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/csrf.php';

setCorsHeaders();
startSecureSession();
requireAuth();

$method   = $_SERVER['REQUEST_METHOD'];
$segments = getPathSegments();

$UPLOAD_DIR = realpath(__DIR__ . '/../server/uploads');
if (!$UPLOAD_DIR) {
    // Create if doesn't exist
    $UPLOAD_DIR = __DIR__ . '/../server/uploads';
    if (!is_dir($UPLOAD_DIR)) {
        mkdir($UPLOAD_DIR, 0755, true);
    }
    $UPLOAD_DIR = realpath($UPLOAD_DIR);
}

$ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$MAX_SIZE      = 5 * 1024 * 1024; // 5MB

// ═════════════════════════════════════════════════════
// POST /api/upload  — Single image upload
// ═════════════════════════════════════════════════════
if ($method === 'POST' && empty($segments)) {
    requireCsrfToken();
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        jsonResponse(['status' => 'error', 'message' => 'Please upload an image'], 400);
    }

    $file = $_FILES['image'];

    // Validate type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    if (!in_array($mimeType, $ALLOWED_TYPES)) {
        jsonResponse(['status' => 'error', 'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'], 400);
    }

    // Validate size
    if ($file['size'] > $MAX_SIZE) {
        jsonResponse(['status' => 'error', 'message' => 'File too large. Maximum size is 5MB.'], 400);
    }

    // Generate unique filename
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = time() . '-' . mt_rand(100000000, 999999999) . '.' . $ext;
    $destination = $UPLOAD_DIR . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        jsonResponse(['status' => 'error', 'message' => 'Failed to upload image'], 500);
    }

    jsonResponse([
        'status' => 'success',
        'data'   => [
            'url'      => '/uploads/' . $filename,
            'filename' => $filename,
            'size'     => $file['size'],
        ],
    ]);
}

// ═════════════════════════════════════════════════════
// POST /api/upload/multiple  — Multiple images upload
// ═════════════════════════════════════════════════════
if ($method === 'POST' && ($segments[0] ?? '') === 'multiple') {
    requireCsrfToken();
    if (!isset($_FILES['images']) || !is_array($_FILES['images']['name'])) {
        jsonResponse(['status' => 'error', 'message' => 'Please upload at least one image'], 400);
    }

    $uploaded = [];
    $fileCount = count($_FILES['images']['name']);

    if ($fileCount > 10) {
        jsonResponse(['status' => 'error', 'message' => 'Maximum 10 images allowed'], 400);
    }

    for ($i = 0; $i < $fileCount; $i++) {
        if ($_FILES['images']['error'][$i] !== UPLOAD_ERR_OK) continue;

        $tmpName = $_FILES['images']['tmp_name'][$i];
        $origName = $_FILES['images']['name'][$i];
        $size = $_FILES['images']['size'][$i];

        // Validate type
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($tmpName);
        if (!in_array($mimeType, $ALLOWED_TYPES)) continue;

        // Validate size
        if ($size > $MAX_SIZE) continue;

        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        $filename = time() . '-' . mt_rand(100000000, 999999999) . '-' . $i . '.' . $ext;
        $destination = $UPLOAD_DIR . DIRECTORY_SEPARATOR . $filename;

        if (move_uploaded_file($tmpName, $destination)) {
            $uploaded[] = [
                'url'      => '/uploads/' . $filename,
                'filename' => $filename,
                'size'     => $size,
            ];
        }
    }

    if (empty($uploaded)) {
        jsonResponse(['status' => 'error', 'message' => 'No images were uploaded'], 400);
    }

    jsonResponse([
        'status'  => 'success',
        'results' => count($uploaded),
        'data'    => ['images' => $uploaded],
    ]);
}

// ═════════════════════════════════════════════════════
// DELETE /api/upload/{filename}  — Delete image
// ═════════════════════════════════════════════════════
if ($method === 'DELETE' && !empty($segments[0])) {
    requireCsrfToken();
    $filename = basename($segments[0]); // Prevent path traversal

    if (!$filename) {
        jsonResponse(['status' => 'error', 'message' => 'Filename is required'], 400);
    }

    $filePath = $UPLOAD_DIR . DIRECTORY_SEPARATOR . $filename;

    // Security: ensure path stays within upload dir
    $realPath = realpath($filePath);
    if (!$realPath || strpos($realPath, $UPLOAD_DIR) !== 0) {
        jsonResponse(['status' => 'error', 'message' => 'Invalid filename'], 400);
    }

    if (!file_exists($realPath)) {
        jsonResponse(['status' => 'error', 'message' => 'Image not found'], 404);
    }

    if (!@unlink($realPath)) {
        jsonResponse(['status' => 'error', 'message' => 'Failed to delete image'], 500);
    }

    jsonResponse(['status' => 'success', 'message' => 'Image deleted successfully']);
}

// ─── Fallback ──────────────────────────────────────
jsonResponse(['status' => 'error', 'message' => 'Invalid upload endpoint'], 404);
