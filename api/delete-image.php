<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get input data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['filename']) || empty($data['filename'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No filename provided']);
    exit;
}

$filename = $data['filename'];

// Validate filename to prevent directory traversal
if (strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\') !== false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid filename']);
    exit;
}

// Define upload directory
$uploadDir = '../uploads/';
$filePath = $uploadDir . $filename;

// Check if file exists
if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'File not found']);
    exit;
}

// Check if it's actually a file (not a directory)
if (!is_file($filePath)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Not a valid file']);
    exit;
}

// Verify it's an image file
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
$fileExtension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

if (!in_array($fileExtension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Not a valid image file']);
    exit;
}

// Try to delete the file
if (unlink($filePath)) {
    echo json_encode(['success' => true, 'message' => 'File deleted successfully']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to delete file']);
}
?>