<?php
/**
 * DrainTrack - Completion Photos API
 * Handle photo uploads for completion reports
 */

// Disable error display for clean JSON
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    $task_id = $_POST['task_id'] ?? null;
    $action = $_POST['action'] ?? 'add_photos';

    if (!$task_id) {
        throw new Exception('Task ID is required');
    }

    // Check if files were uploaded
    if (!isset($_FILES['photos']) || empty($_FILES['photos']['name'][0])) {
        throw new Exception('No photos were uploaded');
    }

    // Create upload directory if it doesn't exist
    $upload_dir = '../uploads/completion_photos/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    $uploaded_files = [];
    $files = $_FILES['photos'];

    // Process each uploaded file
    for ($i = 0; $i < count($files['name']); $i++) {
        if ($files['error'][$i] === UPLOAD_ERR_OK) {
            $file_name = $files['name'][$i];
            $file_tmp = $files['tmp_name'][$i];
            $file_size = $files['size'][$i];
            $file_type = $files['type'][$i];

            // Validate file type
            $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!in_array($file_type, $allowed_types)) {
                continue; // Skip invalid files
            }

            // Validate file size (5MB max)
            if ($file_size > 5 * 1024 * 1024) {
                continue; // Skip large files
            }

            // Generate unique filename
            $file_extension = pathinfo($file_name, PATHINFO_EXTENSION);
            $unique_name = $task_id . '_' . time() . '_' . $i . '.' . $file_extension;
            $file_path = $upload_dir . $unique_name;

            // Move uploaded file
            if (move_uploaded_file($file_tmp, $file_path)) {
                $uploaded_files[] = [
                    'url' => '/uploads/completion_photos/' . $unique_name,
                    'filename' => $unique_name,
                    'original_name' => $file_name,
                    'size' => $file_size,
                    'type' => $file_type
                ];
            }
        }
    }

    if (empty($uploaded_files)) {
        throw new Exception('No valid images were uploaded');
    }

    // Here you would typically save the photo information to your database
    // For now, we'll just return success with the uploaded file info

    echo json_encode([
        'success' => true,
        'message' => count($uploaded_files) . ' photos uploaded successfully',
        'data' => [
            'task_id' => $task_id,
            'uploaded_count' => count($uploaded_files),
            'photos' => $uploaded_files
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>