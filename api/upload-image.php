<?php
header('Content-Type: application/json');
$targetDir = "../uploads/";
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

if (isset($_FILES["image"])) {
    $fileName = uniqid() . "_" . basename($_FILES["image"]["name"]);
    $targetFile = $targetDir . $fileName;
    $fileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
    $allowedTypes = ['jpg', 'jpeg', 'png'];

    if (!in_array($fileType, $allowedTypes)) {
        echo json_encode(['success' => false, 'message' => 'Only JPG and PNG files are allowed.']);
        exit;
    }

    if (move_uploaded_file($_FILES["image"]["tmp_name"], $targetFile)) {
        echo json_encode(['success' => true, 'url' => "uploads/" . $fileName]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to upload image.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'No image uploaded.']);
}
?>