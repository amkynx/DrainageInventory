<?php
/**
 * DrainTrack Enhanced Operator Tasks API
 * Handles both maintenance and inspection tasks for operators
 * Updated to work with centralized authentication system
 * 
 * @author DrainTrack Systems
 * @version 2.0
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if user is authenticated and is an operator
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'Operator') {
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'message' => 'Unauthorized access - Operator role required',
        'redirect' => '../login.html?unauthorized=1'
    ]);
    exit;
}

$operatorId = $_SESSION['user_id'];

// Database configuration
$config = [
    'host' => 'localhost',
    'dbname' => 'drainageinventory', 
    'username' => 'root',
    'password' => ''
];

/**
 * Initialize database connection
 */
function initializeDatabase($config) {
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
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        throw new Exception("Database connection failed");
    }
}

/**
 * Get all tasks for operator (both maintenance and inspections)
 */
function getAllOperatorTasks($pdo, $operatorId) {
    try {
        // Get maintenance tasks
        $maintenanceStmt = $pdo->prepare("
            SELECT mr.*, dp.name as drainage_point_name, dp.latitude, dp.longitude, dp.type as drainage_type,
                   'Maintenance' as task_category, mr.request_type as task_type
            FROM maintenance_requests mr
            LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
            WHERE mr.assigned_to = ?
            ORDER BY 
                CASE mr.priority 
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                END,
                mr.scheduled_date ASC
        ");
        
        $maintenanceStmt->execute([$operatorId]);
        $maintenanceTasks = $maintenanceStmt->fetchAll();
        
        // Get inspection tasks
        $inspectionStmt = $pdo->prepare("
            SELECT ins.*, dp.name as drainage_point_name, dp.latitude, dp.longitude, dp.type as drainage_type,
                   'Inspection' as task_category, ins.inspection_type as task_type
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.operator_id = ?
            ORDER BY 
                CASE ins.priority 
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                END,
                ins.scheduled_date ASC
        ");
        
        $inspectionStmt->execute([$operatorId]);
        $inspectionTasks = $inspectionStmt->fetchAll();
        
        // Combine tasks and add coordinates if available
        $allTasks = array_merge($maintenanceTasks, $inspectionTasks);
        
        foreach ($allTasks as &$task) {
            if ($task['latitude'] && $task['longitude']) {
                $task['coordinates'] = [
                    'lat' => (float)$task['latitude'],
                    'lng' => (float)$task['longitude']
                ];
            }
            unset($task['latitude'], $task['longitude']); // Remove individual lat/lng fields
        }
        
        // Sort combined tasks by priority and date
        usort($allTasks, function($a, $b) {
            $priorityOrder = ['Critical' => 1, 'High' => 2, 'Medium' => 3, 'Low' => 4];
            $aPriority = $priorityOrder[$a['priority']] ?? 5;
            $bPriority = $priorityOrder[$b['priority']] ?? 5;
            
            if ($aPriority === $bPriority) {
                return strtotime($a['scheduled_date']) - strtotime($b['scheduled_date']);
            }
            return $aPriority - $bPriority;
        });
        
        return $allTasks;
        
    } catch (Exception $e) {
        error_log("Error getting all operator tasks: " . $e->getMessage());
        return [];
    }
}

/**
 * Update task status (maintenance or inspection)
 */
function updateTaskStatus($pdo, $operatorId, $data) {
    try {
        $taskId = (int)$data['task_id'];
        $status = $data['status'];
        $notes = $data['notes'] ?? '';
        $taskCategory = $data['task_category'] ?? 'Maintenance';
        $findings = $data['findings'] ?? '';
        $recommendations = $data['recommendations'] ?? '';
        
        $pdo->beginTransaction();
        
        if ($taskCategory === 'Maintenance') {
            // Verify maintenance task belongs to operator
            $checkStmt = $pdo->prepare("SELECT id, status FROM maintenance_requests WHERE id = ? AND assigned_to = ?");
            $checkStmt->execute([$taskId, $operatorId]);
            
            if (!$checkStmt->fetch()) {
                throw new Exception('Maintenance task not found or not assigned to you');
            }
            
            // Update maintenance task
            $updateSql = "UPDATE maintenance_requests SET 
                         status = ?, 
                         updated_at = NOW()";
            $params = [$status];
            
            if ($status === 'Completed') {
                $updateSql .= ", completion_date = NOW()";
            } elseif ($status === 'In Progress') {
                $updateSql .= ", start_date = COALESCE(start_date, NOW())";
            }
            
            if (!empty($findings)) {
                $updateSql .= ", findings = ?";
                $params[] = $findings;
            }
            
            if (!empty($recommendations)) {
                $updateSql .= ", recommendations = ?";
                $params[] = $recommendations;
            }
            
            $updateSql .= " WHERE id = ?";
            $params[] = $taskId;
            
        } else if ($taskCategory === 'Inspection') {
            // Verify inspection task belongs to operator
            $checkStmt = $pdo->prepare("SELECT id, status FROM inspection_schedules WHERE id = ? AND operator_id = ?");
            $checkStmt->execute([$taskId, $operatorId]);
            
            if (!$checkStmt->fetch()) {
                throw new Exception('Inspection task not found or not assigned to you');
            }
            
            // Update inspection task
            $updateSql = "UPDATE inspection_schedules SET 
                         status = ?, 
                         updated_at = NOW()";
            $params = [$status];
            
            if ($status === 'Completed') {
                $updateSql .= ", completion_date = NOW(), end_time = NOW()";
                if (!empty($findings)) {
                    $updateSql .= ", findings = ?";
                    $params[] = $findings;
                }
                if (!empty($recommendations)) {
                    $updateSql .= ", recommendations = ?";
                    $params[] = $recommendations;
                }
            } elseif ($status === 'In Progress') {
                $updateSql .= ", start_time = NOW()";
            }
            
            $updateSql .= " WHERE id = ?";
            $params[] = $taskId;
            
        } else {
            throw new Exception('Invalid task category');
        }
        
        if (!$pdo->prepare($updateSql)->execute($params)) {
            throw new Exception('Failed to update task status');
        }
        
        // Add work log entry if notes provided
        if (!empty($notes)) {
            $logSql = "INSERT INTO operator_work_logs (task_id, operator_id, task_category, work_description, created_at) 
                      VALUES (?, ?, ?, ?, NOW())";
            $pdo->prepare($logSql)->execute([$taskId, $operatorId, $taskCategory, $notes]);
        }
        
        $pdo->commit();
        
        return [
            'success' => true, 
            'message' => ucfirst($taskCategory) . ' task status updated successfully',
            'task_id' => $taskId,
            'new_status' => $status,
            'task_category' => $taskCategory
        ];
        
    } catch (Exception $e) {
        $pdo->rollback();
        throw new Exception('Failed to update task: ' . $e->getMessage());
    }
}

/**
 * Schedule a new inspection
 */
function scheduleInspection($pdo, $operatorId, $data) {
    try {
        $drainagePointId = (int)$data['drainage_point_id'];
        $inspectionType = $data['inspection_type'];
        $scheduledDate = $data['scheduled_date'];
        $scheduledTime = $data['scheduled_time'] ?? '09:00:00';
        $priority = $data['priority'] ?? 'Medium';
        $description = $data['description'] ?? '';
        
        // Validate required fields
        if (!$drainagePointId || !$inspectionType || !$scheduledDate) {
            throw new Exception('Missing required fields: drainage_point_id, inspection_type, scheduled_date');
        }
        
        // Verify drainage point exists
        $stmt = $pdo->prepare("SELECT id, name FROM drainage_points WHERE id = ?");
        $stmt->execute([$drainagePointId]);
        $drainagePoint = $stmt->fetch();
        
        if (!$drainagePoint) {
            throw new Exception('Drainage point not found');
        }
        
        // Check for existing inspection on the same date
        $stmt = $pdo->prepare("
            SELECT id FROM inspection_schedules 
            WHERE drainage_point_id = ? 
            AND scheduled_date = ? 
            AND status NOT IN ('Completed', 'Cancelled')
        ");
        $stmt->execute([$drainagePointId, $scheduledDate]);
        
        if ($stmt->fetch()) {
            throw new Exception('An inspection is already scheduled for this drainage point on the selected date');
        }
        
        // Insert new inspection
        $stmt = $pdo->prepare("
            INSERT INTO inspection_schedules (
                drainage_point_id, operator_id, inspection_type, 
                scheduled_date, scheduled_time, priority, 
                description, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled', NOW(), NOW())
        ");
        
        $stmt->execute([
            $drainagePointId, $operatorId, $inspectionType,
            $scheduledDate, $scheduledTime, $priority, $description
        ]);
        
        $inspectionId = $pdo->lastInsertId();
        
        return [
            'success' => true, 
            'message' => 'Inspection scheduled successfully',
            'inspection_id' => $inspectionId,
            'drainage_point_name' => $drainagePoint['name']
        ];
        
    } catch (Exception $e) {
        throw new Exception('Failed to schedule inspection: ' . $e->getMessage());
    }
}

/**
 * Report an issue (creates maintenance request)
 */
function reportIssue($pdo, $operatorId, $data) {
    try {
        $location = $data['location'];
        $issueType = $data['issue_type'];
        $priority = $data['priority'] ?? 'Medium';
        $description = $data['description'];
        
        // Validate required fields
        if (!$location || !$issueType || !$description) {
            throw new Exception('Missing required fields: location, issue_type, description');
        }
        
        // Try to find drainage point by name or ID
        $drainagePointId = null;
        $pointStmt = $pdo->prepare("
            SELECT id FROM drainage_points 
            WHERE name LIKE ? OR id = ? 
            LIMIT 1
        ");
        $pointStmt->execute(["%$location%", $location]);
        $point = $pointStmt->fetch();
        
        if ($point) {
            $drainagePointId = $point['id'];
        }
        
        // Create maintenance request for the issue
        $insertSql = "INSERT INTO maintenance_requests 
                     (drainage_point_id, request_type, description, priority, status, 
                      reported_by, assigned_to, created_at, scheduled_date) 
                     VALUES 
                     (?, ?, ?, ?, 'Pending', ?, ?, NOW(), CURDATE())";
        
        $stmt = $pdo->prepare($insertSql);
        $stmt->execute([
            $drainagePointId, 
            $issueType, 
            $description, 
            $priority, 
            $operatorId, 
            $operatorId
        ]);
        
        return [
            'success' => true, 
            'message' => 'Issue report submitted successfully',
            'issue_id' => $pdo->lastInsertId(),
            'location' => $location
        ];
        
    } catch (Exception $e) {
        throw new Exception('Failed to report issue: ' . $e->getMessage());
    }
}

/**
 * Log work hours
 */
function logWorkHours($pdo, $operatorId, $data) {
    try {
        $taskId = (int)$data['task_id'];
        $workDescription = $data['work_description'];
        $hoursWorked = (float)$data['hours_worked'];
        $completionPercentage = isset($data['completion_percentage']) ? (int)$data['completion_percentage'] : 0;
        $materialsUsed = $data['materials_used'] ?? '';
        $taskCategory = $data['task_category'] ?? 'Maintenance';
        
        // Validate required fields
        if (!$taskId || !$workDescription || !$hoursWorked) {
            throw new Exception('Missing required fields: task_id, work_description, hours_worked');
        }
        
        // Verify task belongs to operator
        if ($taskCategory === 'Maintenance') {
            $checkStmt = $pdo->prepare("SELECT id FROM maintenance_requests WHERE id = ? AND assigned_to = ?");
        } else {
            $checkStmt = $pdo->prepare("SELECT id FROM inspection_schedules WHERE id = ? AND operator_id = ?");
        }
        
        $checkStmt->execute([$taskId, $operatorId]);
        
        if (!$checkStmt->fetch()) {
            throw new Exception('Task not found or not assigned to you');
        }
        
        $pdo->beginTransaction();
        
        // Insert work log
        $logSql = "INSERT INTO operator_work_logs 
                  (task_id, operator_id, task_category, work_description, hours_worked, 
                   completion_percentage, materials_used, created_at) 
                  VALUES 
                  (?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $pdo->prepare($logSql);
        $stmt->execute([
            $taskId, $operatorId, $taskCategory, $workDescription, 
            $hoursWorked, $completionPercentage, $materialsUsed
        ]);
        
        // Update task progress if provided
        if ($completionPercentage > 0) {
            if ($taskCategory === 'Maintenance') {
                $updateSql = "UPDATE maintenance_requests 
                             SET completion_percentage = ?, updated_at = NOW()";
                if ($completionPercentage >= 100) {
                    $updateSql .= ", status = 'Completed', completion_date = NOW()";
                } elseif ($completionPercentage > 0) {
                    $updateSql .= ", status = 'In Progress', start_date = COALESCE(start_date, NOW())";
                }
                $updateSql .= " WHERE id = ?";
            } else {
                $updateSql = "UPDATE inspection_schedules 
                             SET completion_percentage = ?, updated_at = NOW()";
                if ($completionPercentage >= 100) {
                    $updateSql .= ", status = 'Completed', completion_date = NOW(), end_time = NOW()";
                } elseif ($completionPercentage > 0) {
                    $updateSql .= ", status = 'In Progress', start_time = COALESCE(start_time, NOW())";
                }
                $updateSql .= " WHERE id = ?";
            }
            
            $pdo->prepare($updateSql)->execute([$completionPercentage, $taskId]);
        }
        
        $pdo->commit();
        
        return [
            'success' => true, 
            'message' => 'Work log entry created successfully',
            'log_id' => $pdo->lastInsertId(),
            'task_category' => $taskCategory
        ];
        
    } catch (Exception $e) {
        $pdo->rollback();
        throw new Exception('Failed to log work hours: ' . $e->getMessage());
    }
}

// Handle GET request - Get operator's enhanced tasks
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = initializeDatabase($config);
        $allTasks = getAllOperatorTasks($pdo, $operatorId);
        
        // Separate by category for frontend
        $maintenanceTasks = array_filter($allTasks, function($task) {
            return $task['task_category'] === 'Maintenance';
        });
        
        $inspectionTasks = array_filter($allTasks, function($task) {
            return $task['task_category'] === 'Inspection';
        });
        
        echo json_encode([
            'success' => true,
            'tasks' => $allTasks,
            'maintenance_tasks' => array_values($maintenanceTasks),
            'inspection_tasks' => array_values($inspectionTasks),
            'total_count' => count($allTasks),
            'maintenance_count' => count($maintenanceTasks),
            'inspection_count' => count($inspectionTasks),
            'operator' => [
                'id' => $_SESSION['user_id'],
                'name' => $_SESSION['user_name'],
                'role' => $_SESSION['user_role']
            ],
            'enhanced_features' => [
                'inspection_management' => true,
                'combined_task_view' => true
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Enhanced operator tasks error: " . $e->getMessage());
        
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Error fetching enhanced tasks: ' . $e->getMessage()
        ]);
    }
    exit;
}

// Handle PUT request - Update task status (maintenance or inspection)
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!isset($data['task_id']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Task ID and status are required']);
            exit;
        }
        
        $pdo = initializeDatabase($config);
        $result = updateTaskStatus($pdo, $operatorId, $data);
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        error_log("Enhanced task update error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// Handle POST request - Various enhanced actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!isset($data['action'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Action is required']);
            exit;
        }
        
        $pdo = initializeDatabase($config);
        $action = $data['action'];
        
        switch ($action) {
            case 'schedule_inspection':
                $result = scheduleInspection($pdo, $operatorId, $data);
                break;
                
            case 'report_issue':
                $result = reportIssue($pdo, $operatorId, $data);
                break;
                
            case 'work_log':
                $result = logWorkHours($pdo, $operatorId, $data);
                break;
                
            default:
                throw new Exception('Invalid action specified: ' . $action);
        }
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        error_log("Enhanced operator tasks POST error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>