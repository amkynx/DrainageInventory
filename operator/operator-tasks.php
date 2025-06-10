<?php
/**
 * DrainTrack Enhanced Operator Tasks API
 * Now includes all inspector functions - operators handle both maintenance and inspections
 * Fixed to match actual database structure
 * 
 * @author DrainTrack Systems
 * @version 3.1 (Database-Aligned)
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
        // Get maintenance tasks - Fixed table reference
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
        
        // Get inspection tasks - Fixed field reference (only operator_id exists)
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
 * Start an inspection
 */
function startInspection($pdo, $operatorId, $inspectionId, $notes = '') {
    try {
        // Verify inspection belongs to operator
        $stmt = $pdo->prepare("
            SELECT id, status FROM inspection_schedules 
            WHERE id = ? AND operator_id = ?
        ");
        $stmt->execute([$inspectionId, $operatorId]);
        $inspection = $stmt->fetch();
        
        if (!$inspection) {
            throw new Exception('Inspection not found or not assigned to you');
        }
        
        if ($inspection['status'] !== 'Scheduled') {
            throw new Exception('Inspection cannot be started - current status: ' . $inspection['status']);
        }
        
        // Update inspection status
        $stmt = $pdo->prepare("
            UPDATE inspection_schedules 
            SET status = 'In Progress', 
                updated_at = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([$inspectionId]);
        
        // Log activity in user_activity_log instead of non-existent inspection_activity_log
        logOperatorActivity($pdo, $operatorId, 'inspection_started', "Started inspection ID: $inspectionId. Notes: $notes");
        
        return ['success' => true, 'message' => 'Inspection started successfully'];
        
    } catch (Exception $e) {
        throw new Exception('Failed to start inspection: ' . $e->getMessage());
    }
}

/**
 * Complete an inspection
 */
function completeInspection($pdo, $operatorId, $data) {
    try {
        $inspectionId = $data['inspection_id'];
        $findings = $data['findings'] ?? '';
        $recommendations = $data['recommendations'] ?? '';
        $conditionRating = $data['condition_rating'] ?? 'Good';
        $maintenanceRequired = isset($data['maintenance_required']) ? (bool)$data['maintenance_required'] : false;
        $createMaintenanceRequest = $data['create_maintenance_request'] ?? false;
        
        // Verify inspection belongs to operator
        $stmt = $pdo->prepare("
            SELECT id, status, drainage_point_id FROM inspection_schedules 
            WHERE id = ? AND operator_id = ?
        ");
        $stmt->execute([$inspectionId, $operatorId]);
        $inspection = $stmt->fetch();
        
        if (!$inspection) {
            throw new Exception('Inspection not found or not assigned to you');
        }
        
        if ($inspection['status'] !== 'In Progress') {
            throw new Exception('Inspection cannot be completed - current status: ' . $inspection['status']);
        }
        
        // Begin transaction
        $pdo->beginTransaction();
        
        // Update inspection status - only update fields that exist in database
        $stmt = $pdo->prepare("
            UPDATE inspection_schedules 
            SET status = 'Completed',
                completion_date = NOW(),
                findings = ?,
                recommendations = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([
            $findings, 
            $recommendations, 
            $inspectionId
        ]);
        
        // Update drainage point condition if applicable
        if ($conditionRating && $inspection['drainage_point_id']) {
            $newStatus = mapConditionToStatus($conditionRating);
            $stmt = $pdo->prepare("
                UPDATE drainage_points 
                SET status = ?, last_inspection = CURDATE()
                WHERE id = ?
            ");
            $stmt->execute([$newStatus, $inspection['drainage_point_id']]);
        }
        
        // Create maintenance request if requested
        if ($createMaintenanceRequest && $maintenanceRequired) {
            $maintenanceId = createMaintenanceRequestFromInspection($pdo, $inspection['drainage_point_id'], $findings, $recommendations, $operatorId);
            if ($maintenanceId) {
                // Update the inspection with maintenance_required flag
                $stmt = $pdo->prepare("UPDATE inspection_schedules SET maintenance_required = 1 WHERE id = ?");
                $stmt->execute([$inspectionId]);
            }
        }
        
        // Log activity
        logOperatorActivity($pdo, $operatorId, 'inspection_completed', "Completed inspection ID: $inspectionId. Findings: $findings");
        
        $pdo->commit();
        
        return ['success' => true, 'message' => 'Inspection completed successfully'];
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw new Exception('Failed to complete inspection: ' . $e->getMessage());
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
                $reportData = generateCompletionReport($pdo, $taskId, $taskCategory, $data);
                notifyAdminNewReport($pdo, $taskId, $taskCategory, $operatorId);

                $updateSql .= ", completion_date = NOW()";
            } elseif ($status === 'In Progress') {
                $updateSql .= ", work_start_date = COALESCE(work_start_date, NOW())";
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
            
            // Update inspection task - only update fields that exist
            $updateSql = "UPDATE inspection_schedules SET 
                         status = ?, 
                         updated_at = NOW()";
            $params = [$status];
            
            if ($status === 'Completed') {
                $updateSql .= ", completion_date = NOW()";
                if (!empty($findings)) {
                    $updateSql .= ", findings = ?";
                    $params[] = $findings;
                }
                if (!empty($recommendations)) {
                    $updateSql .= ", recommendations = ?";
                    $params[] = $recommendations;
                }
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
            $logSql = "INSERT INTO operator_work_logs (task_id, operator_id, task_category, work_description, work_date, created_at) 
                      VALUES (?, ?, ?, ?, CURDATE(), NOW())";
            $pdo->prepare($logSql)->execute([$taskId, $operatorId, $taskCategory, $notes]);
        }
        
        // Log operator activity
        logOperatorActivity($pdo, $operatorId, 'task_updated', "Updated $taskCategory task $taskId to status: $status");
        
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
function generateCompletionReport($pdo, $taskId, $taskCategory, $completionData) {
    $additionalFields = [];
    $additionalValues = [];
    
    // Add completion-specific fields
    if (isset($completionData['work_summary'])) {
        $additionalFields[] = "work_summary = ?";
        $additionalValues[] = $completionData['work_summary'];
    }
    
    if (isset($completionData['hours_worked'])) {
        $additionalFields[] = "hours_worked = ?";
        $additionalValues[] = $completionData['hours_worked'];
    }
    
    if (isset($completionData['materials_used'])) {
        $additionalFields[] = "materials_used = ?";
        $additionalValues[] = $completionData['materials_used'];
    }
    
    if (isset($completionData['completion_notes'])) {
        $additionalFields[] = "completion_notes = ?";
        $additionalValues[] = $completionData['completion_notes'];
    }
    
    if (!empty($additionalFields)) {
        if ($taskCategory === 'Maintenance') {
            $sql = "UPDATE maintenance_requests SET " . implode(', ', $additionalFields) . " WHERE id = ?";
        } else {
            $sql = "UPDATE inspection_schedules SET " . implode(', ', $additionalFields) . " WHERE id = ?";
        }
        
        $additionalValues[] = $taskId;
        $pdo->prepare($sql)->execute($additionalValues);
    }
    
    return true;
}

function notifyAdminNewReport($pdo, $taskId, $taskCategory, $operatorId) {
    try {
        // Get operator details
        $operatorStmt = $pdo->prepare("SELECT first_name, last_name FROM users WHERE id = ?");
        $operatorStmt->execute([$operatorId]);
        $operator = $operatorStmt->fetch();
        $operatorName = ($operator['first_name'] ?? '') . ' ' . ($operator['last_name'] ?? '');
        
        // Get task details
        if ($taskCategory === 'Maintenance') {
            $taskStmt = $pdo->prepare("
                SELECT mr.request_number, mr.request_type, dp.name as location 
                FROM maintenance_requests mr 
                LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id 
                WHERE mr.id = ?
            ");
        } else {
            $taskStmt = $pdo->prepare("
                SELECT ins.schedule_number as request_number, ins.inspection_type as request_type, dp.name as location 
                FROM inspection_schedules ins 
                LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id 
                WHERE ins.id = ?
            ");
        }
        
        $taskStmt->execute([$taskId]);
        $task = $taskStmt->fetch();
        
        // Get all admin users
        $adminStmt = $pdo->prepare("SELECT id FROM users WHERE role = 'Admin'");
        $adminStmt->execute();
        $admins = $adminStmt->fetchAll();
        
        // Create notification for each admin
        foreach ($admins as $admin) {
            $notificationSql = "INSERT INTO admin_notifications 
                               (admin_id, title, message, type, task_id, task_category, created_at, is_read) 
                               VALUES (?, ?, ?, 'completion_report', ?, ?, NOW(), 0)";
            
            $title = "New Completion Report: " . ($task['request_number'] ?? "Task #$taskId");
            $message = "$operatorName completed {$taskCategory} task at " . ($task['location'] ?? 'Unknown Location') . 
                      ". Report ready for review.";
            
            $pdo->prepare($notificationSql)->execute([
                $admin['id'], 
                $title, 
                $message, 
                $taskId, 
                $taskCategory
            ]);
        }
        
        // Log the notification
        logOperatorActivity($pdo, $operatorId, 'report_generated', 
                          "Generated completion report for $taskCategory task $taskId");
        
        return true;
        
    } catch (Exception $e) {
        error_log("Failed to notify admin of new report: " . $e->getMessage());
        return false; // Don't throw exception - notification failure shouldn't stop task completion
    }
}
/**
 * Schedule a new inspection
 */
function scheduleInspection($pdo, $operatorId, $data) {
    try {
        $drainagePointId = $data['drainage_point_id'];
        $inspectionType = $data['inspection_type'];
        $scheduledDate = $data['scheduled_date'];
        $scheduledTime = $data['scheduled_time'] ?? '09:00';
        $priority = $data['priority'] ?? 'Medium';
        $frequency = $data['frequency'] ?? 'One-time';
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
        
        // Generate schedule number
        $scheduleNumber = generateScheduleNumber($pdo);
        
        // Insert new inspection
        $stmt = $pdo->prepare("
            INSERT INTO inspection_schedules (
                schedule_number, drainage_point_id, operator_id, inspection_type, 
                scheduled_date, scheduled_time, priority, frequency, 
                description, status, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $scheduleNumber, $drainagePointId, $operatorId, $inspectionType,
            $scheduledDate, $scheduledTime, $priority, 
            $frequency, $description, $operatorId
        ]);
        
        $inspectionId = $pdo->lastInsertId();
        
        // Log activity
        logOperatorActivity($pdo, $operatorId, 'inspection_scheduled', "Scheduled inspection $scheduleNumber for {$drainagePoint['name']}");
        
        return [
            'success' => true, 
            'message' => 'Inspection scheduled successfully',
            'inspection_id' => $inspectionId,
            'schedule_number' => $scheduleNumber,
            'drainage_point_name' => $drainagePoint['name']
        ];
        
    } catch (Exception $e) {
        throw new Exception('Failed to schedule inspection: ' . $e->getMessage());
    }
}

/**
 * Report an issue (creates issue report)
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
        
        // Create issue report
        $insertSql = "INSERT INTO operator_issue_reports 
                     (operator_id, location, drainage_point_id, issue_type, priority, description, status, created_at, updated_at) 
                     VALUES 
                     (?, ?, ?, ?, ?, ?, 'Open', NOW(), NOW())";
        
        $stmt = $pdo->prepare($insertSql);
        $stmt->execute([
            $operatorId,
            $location, 
            $drainagePointId, 
            $issueType, 
            $priority, 
            $description
        ]);
        
        $issueId = $pdo->lastInsertId();
        
        // Log activity
        logOperatorActivity($pdo, $operatorId, 'issue_reported', "Reported $issueType issue at $location");
        
        return [
            'success' => true, 
            'message' => 'Issue report submitted successfully',
            'issue_id' => $issueId,
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
            $checkStmt->execute([$taskId, $operatorId]);
        } else {
            $checkStmt = $pdo->prepare("SELECT id FROM inspection_schedules WHERE id = ? AND operator_id = ?");
            $checkStmt->execute([$taskId, $operatorId]);
        }
        
        if (!$checkStmt->fetch()) {
            throw new Exception('Task not found or not assigned to you');
        }
        
        $pdo->beginTransaction();
        
        // Insert work log
        $logSql = "INSERT INTO operator_work_logs 
                  (task_id, operator_id, task_category, work_description, hours_worked, 
                   completion_percentage, materials_used, work_date, created_at) 
                  VALUES 
                  (?, ?, ?, ?, ?, ?, ?, CURDATE(), NOW())";
        
        $stmt = $pdo->prepare($logSql);
        $stmt->execute([
            $taskId, $operatorId, $taskCategory, $workDescription, 
            $hoursWorked, $completionPercentage, $materialsUsed
        ]);
        
        // Update task progress if provided and field exists
        if ($completionPercentage > 0 && $taskCategory === 'Maintenance') {
            $updateSql = "UPDATE maintenance_requests 
                         SET completion_percentage = ?, updated_at = NOW()";
            $params = [$completionPercentage];
            
            if ($completionPercentage >= 100) {
                $updateSql .= ", status = 'Completed', completion_date = NOW()";
            } elseif ($completionPercentage > 0) {
                $updateSql .= ", status = 'In Progress', work_start_date = COALESCE(work_start_date, NOW())";
            }
            $updateSql .= " WHERE id = ?";
            $params[] = $taskId;
            
            $pdo->prepare($updateSql)->execute($params);
        }
        
        // Log activity
        logOperatorActivity($pdo, $operatorId, 'work_logged', "Logged $hoursWorked hours for $taskCategory task $taskId");
        
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

/**
 * Create maintenance request based on inspection findings
 */
function createMaintenanceRequestFromInspection($pdo, $drainagePointId, $findings, $recommendations, $operatorId) {
    try {
        $priority = 'Medium'; // Default priority
        $description = "Maintenance required based on inspection findings: " . $findings;
        if ($recommendations) {
            $description .= "\n\nRecommendations: " . $recommendations;
        }
        
        // Generate request number
        $requestNumber = generateMaintenanceRequestNumber($pdo);
        
        $stmt = $pdo->prepare("
            INSERT INTO maintenance_requests (
                request_number, drainage_point_id, request_type, priority, description,
                status, requested_by, assigned_to, scheduled_date, created_at, updated_at
            ) VALUES (?, ?, 'Inspection Follow-up', ?, ?, 'Pending', ?, ?, CURDATE(), NOW(), NOW())
        ");
        
        $stmt->execute([
            $requestNumber,
            $drainagePointId,
            $priority,
            $description,
            $operatorId,
            $operatorId
        ]);
        
        return $pdo->lastInsertId();
        
    } catch (Exception $e) {
        error_log("Failed to create maintenance request: " . $e->getMessage());
        return null;
    }
}

/**
 * Log operator activity
 */
function logOperatorActivity($pdo, $operatorId, $action, $details = '') {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO user_activity_log (
                user_id, action, description, created_at
            ) VALUES (?, ?, ?, NOW())
        ");
        
        $stmt->execute([$operatorId, $action, $details]);
        
    } catch (Exception $e) {
        error_log("Failed to log operator activity: " . $e->getMessage());
    }
}

/**
 * Generate schedule number for inspections
 */
function generateScheduleNumber($pdo) {
    $year = date('Y');
    $month = date('m');
    
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
function generateMaintenanceRequestNumber($pdo) {
    $year = date('Y');
    $month = date('m');
    
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

/**
 * Map condition rating to drainage point status
 */
function mapConditionToStatus($conditionRating) {
    $statusMap = [
        'Excellent' => 'Good',
        'Good' => 'Good',
        'Fair' => 'Needs Maintenance',
        'Poor' => 'Needs Maintenance',
        'Critical' => 'Critical'
    ];
    
    return $statusMap[$conditionRating] ?? 'Good';
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
                'name' => $_SESSION['user_name'] ?? ($_SESSION['first_name'] . ' ' . $_SESSION['last_name']),
                'role' => $_SESSION['user_role']
            ],
            'enhanced_features' => [
                'inspection_management' => true,
                'combined_task_view' => true,
                'inspector_functions' => true
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
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
            exit;
        }
        
        $pdo = initializeDatabase($config);
        $action = $data['action'] ?? '';
        
        switch ($action) {
            case 'start_inspection':
                $result = startInspection($pdo, $operatorId, $data['inspection_id'], $data['notes'] ?? '');
                break;
                
            case 'complete_inspection':
                $result = completeInspection($pdo, $operatorId, $data);
                break;
                
            default:
                // Regular task status update
                if (!isset($data['task_id']) || !isset($data['status'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Task ID and status are required']);
                    exit;
                }
                $result = updateTaskStatus($pdo, $operatorId, $data);
                break;
        }
        
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
            case 'submit_issue_report':
                $result = reportIssue($pdo, $operatorId, $data);
                break;
                
            case 'work_log':
            case 'log_work_hours':
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