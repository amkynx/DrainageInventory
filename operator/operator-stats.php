<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'Operator') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$operatorId = $_SESSION['user_id'];

// Database connection (copy from your operator-tasks.php)
$config = [
    'host' => 'localhost',
    'dbname' => 'drainageinventory', 
    'username' => 'root',
    'password' => ''
];

try {
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['dbname']}", $config['username'], $config['password']);
    
    // Get stats
    $stats = [];
    
    // Pending tasks
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM (
            SELECT id FROM maintenance_requests WHERE assigned_to = ? AND status = 'Pending'
            UNION ALL
            SELECT id FROM inspection_schedules WHERE operator_id = ? AND status = 'Scheduled'
        ) as pending_tasks
    ");
    $stmt->execute([$operatorId, $operatorId]);
    $stats['pending'] = $stmt->fetchColumn();
    
    // In progress tasks  
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM (
            SELECT id FROM maintenance_requests WHERE assigned_to = ? AND status = 'In Progress'
            UNION ALL
            SELECT id FROM inspection_schedules WHERE operator_id = ? AND status = 'In Progress'
        ) as progress_tasks
    ");
    $stmt->execute([$operatorId, $operatorId]);
    $stats['in_progress'] = $stmt->fetchColumn();
    
    // Completed today
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM (
            SELECT id FROM maintenance_requests WHERE assigned_to = ? AND status = 'Completed' AND DATE(completion_date) = CURDATE()
            UNION ALL
            SELECT id FROM inspection_schedules WHERE operator_id = ? AND status = 'Completed' AND DATE(completion_date) = CURDATE()
        ) as completed_today
    ");
    $stmt->execute([$operatorId, $operatorId]);
    $stats['completed_today'] = $stmt->fetchColumn();
    
    // Overdue tasks
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM (
            SELECT id FROM maintenance_requests WHERE assigned_to = ? AND status IN ('Pending', 'In Progress') AND scheduled_date < CURDATE()
            UNION ALL
            SELECT id FROM inspection_schedules WHERE operator_id = ? AND status IN ('Scheduled', 'In Progress') AND scheduled_date < CURDATE()
        ) as overdue_tasks
    ");
    $stmt->execute([$operatorId, $operatorId]);
    $stats['overdue'] = $stmt->fetchColumn();
    
    // Completion rate (last 30 days)
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
            COUNT(*) as total
        FROM (
            SELECT status FROM maintenance_requests WHERE assigned_to = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            UNION ALL
            SELECT status FROM inspection_schedules WHERE operator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ) as recent_tasks
    ");
    $stmt->execute([$operatorId, $operatorId]);
    $completion = $stmt->fetch();
    $stats['completion_rate'] = $completion['total'] > 0 ? round(($completion['completed'] / $completion['total']) * 100) : 0;
    
    // Completed this week
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM (
            SELECT id FROM maintenance_requests WHERE assigned_to = ? AND status = 'Completed' AND WEEK(completion_date) = WEEK(NOW())
            UNION ALL
            SELECT id FROM inspection_schedules WHERE operator_id = ? AND status = 'Completed' AND WEEK(completion_date) = WEEK(NOW())
        ) as completed_week
    ");
    $stmt->execute([$operatorId, $operatorId]);
    $stats['completed_this_week'] = $stmt->fetchColumn();
    
    echo json_encode($stats);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
?>