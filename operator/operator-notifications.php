<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'Operator') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$operatorId = $_SESSION['user_id'];

// For now, return sample notifications
// You can enhance this later to read from a notifications table
$notifications = [
    [
        'id' => 1,
        'title' => 'Task Reminder',
        'message' => 'You have ' . rand(1,3) . ' pending tasks due today',
        'type' => 'info',
        'created_at' => date('Y-m-d H:i:s')
    ],
    [
        'id' => 2,
        'title' => 'Inspection Due',
        'message' => 'Routine inspection scheduled for tomorrow',
        'type' => 'warning',
        'created_at' => date('Y-m-d H:i:s', strtotime('-1 hour'))
    ]
];

echo json_encode($notifications);
?>