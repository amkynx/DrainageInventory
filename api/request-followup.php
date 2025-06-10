<?php
/**
 * DrainTrack - Request Follow-up Work API
 * Allow admins to request follow-up work based on completion reports
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
    $requested_by = $_SESSION['user_id'];
    $reason = $input['reason'] ?? '';
    $follow_up_type = $input['follow_up_type'] ?? '';
    $priority = $input['priority'] ?? 'Medium';
    
    if (!$task_id || !$task_type || !$reason) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Task ID, type, and reason are required']);
        exit();
    }
    
    $pdo->beginTransaction();
    
    try {
        // Get original task details
        if ($task_type === 'maintenance') {
            $sql = "SELECT mr.*, dp.name as drainage_point_name 
                   FROM maintenance_requests mr 
                   LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id 
                   WHERE mr.id = ? AND mr.status = 'Completed'";
        } else if ($task_type === 'inspection') {
            $sql = "SELECT ins.*, dp.name as drainage_point_name 
                   FROM inspection_schedules ins 
                   LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id 
                   WHERE ins.id = ? AND ins.status = 'Completed'";
        } else {
            throw new Exception('Invalid task type. Must be "maintenance" or "inspection".');
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$task_id]);
        $original_task = $stmt->fetch();
        
        if (!$original_task) {
            throw new Exception('Original completed task not found');
        }
        
        // Check if follow-up has already been requested
        $check_followup_sql = $task_type === 'maintenance' ?
            "SELECT follow_up_requested FROM maintenance_requests WHERE id = ? AND follow_up_requested = 1" :
            "SELECT follow_up_requested FROM inspection_schedules WHERE id = ? AND follow_up_requested = 1";
        
        $check_stmt = $pdo->prepare($check_followup_sql);
        $check_stmt->execute([$task_id]);
        
        if ($check_stmt->fetch()) {
            throw new Exception('Follow-up has already been requested for this task');
        }
        
        // Generate numbers for new tasks
        $year = date('Y');
        $month = date('m');
        $follow_up_id = null;
        
        // Create follow-up task based on type requested or original type
        if ($follow_up_type && strtolower($follow_up_type) === 'inspection' || 
            (!$follow_up_type && $task_type === 'inspection')) {
            
            // Create follow-up inspection
            $schedule_number = generateScheduleNumber($pdo, $year, $month);
            
            $description = "FOLLOW-UP INSPECTION: " . $reason;
            if ($original_task['findings'] ?? $original_task['description']) {
                $description .= "\n\nOriginal findings: " . ($original_task['findings'] ?? $original_task['description']);
            }
            
            $scheduled_date = date('Y-m-d', strtotime('+1 week'));
            
            $follow_up_sql = "INSERT INTO inspection_schedules 
                             (schedule_number, drainage_point_id, inspection_type, priority, status, description, 
                              operator_id, created_by, parent_task_id, parent_task_type, scheduled_date, created_at, updated_at) 
                             VALUES (?, ?, ?, ?, 'Scheduled', ?, ?, ?, ?, ?, ?, NOW(), NOW())";
            
            $inspection_type = $follow_up_type ?: ($original_task['inspection_type'] ?? 'Follow-up Inspection');
            $operator_id = $original_task['operator_id'] ?? $original_task['assigned_to'];
            
            $stmt = $pdo->prepare($follow_up_sql);
            $stmt->execute([
                $schedule_number,
                $original_task['drainage_point_id'],
                $inspection_type,
                $priority,
                $description,
                $operator_id,
                $requested_by,
                $task_id,
                $task_type,
                $scheduled_date
            ]);
            
        } else {
            
            // Create follow-up maintenance
            $request_number = generateRequestNumber($pdo, $year, $month);
            
            $description = "FOLLOW-UP MAINTENANCE: " . $reason;
            if ($original_task['recommendations'] ?? $original_task['findings']) {
                $description .= "\n\nOriginal recommendations: " . ($original_task['recommendations'] ?? $original_task['findings']);
            }
            
            $scheduled_date = date('Y-m-d', strtotime('+3 days'));
            
            $follow_up_sql = "INSERT INTO maintenance_requests 
                             (request_number, drainage_point_id, request_type, priority, description,
                              status, requested_by, assigned_to, created_by, parent_task_id, parent_task_type, 
                              scheduled_date, created_at, updated_at) 
                             VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, NOW(), NOW())";
            
            $request_type = $follow_up_type ?: ($original_task['request_type'] ?? 'Follow-up Maintenance');
            $assigned_to = $original_task['assigned_to'] ?? $original_task['operator_id'];
            
            $stmt = $pdo->prepare($follow_up_sql);
            $stmt->execute([
                $request_number,
                $original_task['drainage_point_id'],
                $request_type,
                $priority,
                $description,
                $requested_by,
                $assigned_to,
                $requested_by,
                $task_id,
                $task_type,
                $scheduled_date
            ]);
        }
        
        $follow_up_id = $pdo->lastInsertId();
        
        // Mark original task as having follow-up requested
        if ($task_type === 'maintenance') {
            $update_sql = "UPDATE maintenance_requests SET 
                          follow_up_requested = 1, 
                          follow_up_reason = ?,
                          follow_up_task_id = ?,
                          updated_at = NOW()
                          WHERE id = ?";
        } else {
            $update_sql = "UPDATE inspection_schedules SET 
                          follow_up_requested = 1, 
                          follow_up_reason = ?,
                          follow_up_task_id = ?,
                          updated_at = NOW()
                          WHERE id = ?";
        }
        
        $stmt = $pdo->prepare($update_sql);
        $stmt->execute([$reason, $follow_up_id, $task_id]);
        
        // Log the follow-up request
        $activity_sql = "INSERT INTO user_activity_log (user_id, action, description, created_at) 
                        VALUES (?, ?, ?, NOW())";
        $activity_stmt = $pdo->prepare($activity_sql);
        
        $task_number = $original_task['request_number'] ?? $original_task['schedule_number'] ?? $task_id;
        $description = "Requested follow-up work for {$task_type} task {$task_number} at {$original_task['drainage_point_name']}. Reason: {$reason}";
        
        $activity_stmt->execute([
            $requested_by, 
            'request_followup', 
            $description
        ]);
        
        // Create notification for the assigned operator
        $assigned_operator = $original_task['assigned_to'] ?? $original_task['operator_id'];
        if ($assigned_operator) {
            $notification_sql = "INSERT INTO operator_notifications 
                               (operator_id, title, message, type, task_id, task_category, created_at, is_read) 
                               VALUES (?, ?, ?, 'follow_up', ?, ?, NOW(), 0)";
            
            $admin_name = $_SESSION['user_name'] ?? ($_SESSION['first_name'] . ' ' . $_SESSION['last_name']);
            $title = "Follow-up Work Requested";
            $follow_up_task_type = $follow_up_type ?: $task_type;
            $message = "Follow-up {$follow_up_task_type} work has been requested for {$original_task['drainage_point_name']} by {$admin_name}. Reason: {$reason}";
            
            $notification_stmt = $pdo->prepare($notification_sql);
            $notification_stmt->execute([
                $assigned_operator, 
                $title, 
                $message, 
                $follow_up_id, 
                $follow_up_task_type
            ]);
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Follow-up work requested successfully',
            'data' => [
                'original_task_id' => $task_id,
                'original_task_type' => $task_type,
                'follow_up_task_id' => $follow_up_id,
                'follow_up_task_type' => $follow_up_type ?: $task_type,
                'follow_up_task_number' => $schedule_number ?? $request_number ?? null,
                'reason' => $reason,
                'priority' => $priority,
                'assigned_to' => $assigned_operator,
                'location' => $original_task['drainage_point_name']
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Database error in request-followup.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("Error in request-followup.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

/**
 * Generate schedule number for inspections
 */
function generateScheduleNumber($pdo, $year, $month) {
    // Get the last schedule number for this month
    $stmt = $pdo->prepare("
        SELECT schedule_number FROM inspection_schedules 
        WHERE schedule_number LIKE ? 
        ORDER BY schedule_number DESC 
        LIMIT 1
    ");
    $stmt->execute(["IS{$year}{$month}%"]);
    $lastSchedule = $stmt->fetch();
    
    if ($lastSchedule) {
        $lastNumber = (int)substr($lastSchedule['schedule_number'], -3);
        $newNumber = $lastNumber + 1;
    } else {
        $newNumber = 1;
    }
    
    return "IS{$year}{$month}" . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
}

/**
 * Generate request number for maintenance
 */
function generateRequestNumber($pdo, $year, $month) {
    // Get the last request number for this month
    $stmt = $pdo->prepare("
        SELECT request_number FROM maintenance_requests 
        WHERE request_number LIKE ? 
        ORDER BY request_number DESC 
        LIMIT 1
    ");
    $stmt->execute(["MR{$year}{$month}%"]);
    $lastRequest = $stmt->fetch();
    
    if ($lastRequest) {
        $lastNumber = (int)substr($lastRequest['request_number'], -3);
        $newNumber = $lastNumber + 1;
    } else {
        $newNumber = 1;
    }
    
    return "MR{$year}{$month}" . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
}
?>