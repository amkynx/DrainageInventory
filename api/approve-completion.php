<?php
/**
 * DrainTrack - Approve Completion Report API
 * Allow admins to approve completion reports
 * 
 * @author DrainTrack Systems
 * @version 1.0
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

// Check authentication and admin role
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'Admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin role required.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Database configuration
$config = [
    'host' => 'localhost',
    'dbname' => 'drainageinventory',
    'username' => 'root',
    'password' => ''
];

try {
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4",
        $config['username'],
        $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        exit();
    }
    
    $task_id = $input['task_id'] ?? null;
    $task_type = $input['task_type'] ?? null;
    $approved_by = $_SESSION['user_id'];
    $approval_notes = $input['notes'] ?? '';
    
    if (!$task_id || !$task_type) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Task ID and type are required']);
        exit();
    }
    
    $pdo->beginTransaction();
    
    try {
        // Verify task exists and is completed
        if ($task_type === 'maintenance') {
            $check_sql = "SELECT id, status, request_number, assigned_to FROM maintenance_requests WHERE id = ? AND status = 'Completed'";
            $update_sql = "UPDATE maintenance_requests SET 
                          approved_by = ?, 
                          approved_at = NOW(), 
                          approval_notes = ?,
                          updated_at = NOW()
                          WHERE id = ?";
        } else if ($task_type === 'inspection') {
            $check_sql = "SELECT id, status, schedule_number as request_number, operator_id as assigned_to FROM inspection_schedules WHERE id = ? AND status = 'Completed'";
            $update_sql = "UPDATE inspection_schedules SET 
                          approved_by = ?, 
                          approved_at = NOW(), 
                          approval_notes = ?,
                          updated_at = NOW()
                          WHERE id = ?";
        } else {
            throw new Exception('Invalid task type. Must be "maintenance" or "inspection".');
        }
        
        $check_stmt = $pdo->prepare($check_sql);
        $check_stmt->execute([$task_id]);
        $task = $check_stmt->fetch();
        
        if (!$task) {
            throw new Exception('Task not found or not in completed status');
        }
        
        // Check if already approved
        $existing_approval_sql = $task_type === 'maintenance' ? 
            "SELECT approved_by FROM maintenance_requests WHERE id = ? AND approved_by IS NOT NULL" :
            "SELECT approved_by FROM inspection_schedules WHERE id = ? AND approved_by IS NOT NULL";
        
        $existing_stmt = $pdo->prepare($existing_approval_sql);
        $existing_stmt->execute([$task_id]);
        
        if ($existing_stmt->fetch()) {
            throw new Exception('This completion report has already been approved');
        }
        
        // Update with approval
        $update_stmt = $pdo->prepare($update_sql);
        $update_stmt->execute([$approved_by, $approval_notes, $task_id]);
        
        if ($update_stmt->rowCount() === 0) {
            throw new Exception('Failed to update approval status');
        }
        
        // Log the approval activity
        $activity_sql = "INSERT INTO user_activity_log (user_id, action, description, created_at) 
                        VALUES (?, ?, ?, NOW())";
        $activity_stmt = $pdo->prepare($activity_sql);
        
        $description = "Approved {$task_type} completion report for task ID: {$task_id} ({$task['request_number']})";
        if ($approval_notes) {
            $description .= ". Notes: " . $approval_notes;
        }
        
        $activity_stmt->execute([
            $approved_by, 
            'approve_completion_report', 
            $description
        ]);
        
        // Create notification for the operator
        if ($task['assigned_to']) {
            $notification_sql = "INSERT INTO operator_notifications 
                               (operator_id, title, message, type, task_id, task_category, created_at, is_read) 
                               VALUES (?, ?, ?, 'approval', ?, ?, NOW(), 0)";
            
            $admin_name = $_SESSION['user_name'] ?? ($_SESSION['first_name'] . ' ' . $_SESSION['last_name']);
            $title = "Completion Report Approved";
            $message = "Your {$task_type} completion report for task {$task['request_number']} has been approved by {$admin_name}.";
            
            if ($approval_notes) {
                $message .= " Notes: " . $approval_notes;
            }
            
            $notification_stmt = $pdo->prepare($notification_sql);
            $notification_stmt->execute([
                $task['assigned_to'], 
                $title, 
                $message, 
                $task_id, 
                $task_type
            ]);
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Completion report approved successfully',
            'data' => [
                'task_id' => $task_id,
                'task_type' => $task_type,
                'approved_by' => $approved_by,
                'approved_at' => date('Y-m-d H:i:s'),
                'approval_notes' => $approval_notes
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Database error in approve-completion.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("Error in approve-completion.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>