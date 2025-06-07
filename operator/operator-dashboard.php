<?php
/**
 * DrainTrack Enhanced Operator Dashboard API
 * Handles both maintenance and inspection tasks for operators
 * Updated to work with centralized authentication system
 * 
 * @author DrainTrack Systems
 * @version 2.0
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
 * Get enhanced operator dashboard statistics including inspections
 */
function getEnhancedOperatorStatistics($pdo, $operatorId) {
    try {
        // Get maintenance statistics
        $maintenanceStmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_maintenance,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_maintenance,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_maintenance,
                SUM(CASE WHEN status = 'Completed' AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as completed_maintenance_week,
                SUM(CASE WHEN priority IN ('High', 'Critical') AND status != 'Completed' THEN 1 ELSE 0 END) as high_priority_maintenance,
                SUM(CASE WHEN scheduled_date < CURDATE() AND status NOT IN ('Completed', 'Cancelled') THEN 1 ELSE 0 END) as overdue_maintenance
            FROM maintenance_requests 
            WHERE assigned_to = ?
        ");
        
        $maintenanceStmt->execute([$operatorId]);
        $maintenanceStats = $maintenanceStmt->fetch() ?: [];
        
        // Get inspection statistics
        $inspectionStmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_inspections,
                SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled_inspections,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_inspections,
                SUM(CASE WHEN status = 'Completed' AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as completed_inspections_week,
                SUM(CASE WHEN priority IN ('High', 'Critical') AND status != 'Completed' THEN 1 ELSE 0 END) as high_priority_inspections,
                SUM(CASE WHEN scheduled_date < CURDATE() AND status NOT IN ('Completed', 'Cancelled') THEN 1 ELSE 0 END) as overdue_inspections
            FROM inspection_schedules 
            WHERE operator_id = ?
        ");
        
        $inspectionStmt->execute([$operatorId]);
        $inspectionStats = $inspectionStmt->fetch() ?: [];
        
        // Combine statistics
        return [
            'total_tasks' => ($maintenanceStats['total_maintenance'] ?? 0) + ($inspectionStats['total_inspections'] ?? 0),
            'pending_tasks' => ($maintenanceStats['pending_maintenance'] ?? 0) + ($inspectionStats['scheduled_inspections'] ?? 0),
            'in_progress_tasks' => ($maintenanceStats['in_progress_maintenance'] ?? 0) + ($inspectionStats['in_progress_inspections'] ?? 0),
            'completed_this_week' => ($maintenanceStats['completed_maintenance_week'] ?? 0) + ($inspectionStats['completed_inspections_week'] ?? 0),
            'high_priority_tasks' => ($maintenanceStats['high_priority_maintenance'] ?? 0) + ($inspectionStats['high_priority_inspections'] ?? 0),
            'overdue_tasks' => ($maintenanceStats['overdue_maintenance'] ?? 0) + ($inspectionStats['overdue_inspections'] ?? 0),
            'total_maintenance' => $maintenanceStats['total_maintenance'] ?? 0,
            'total_inspections' => $inspectionStats['total_inspections'] ?? 0
        ];
        
    } catch (Exception $e) {
        error_log("Error getting enhanced operator statistics: " . $e->getMessage());
        return [
            'total_tasks' => 0,
            'pending_tasks' => 0,
            'in_progress_tasks' => 0,
            'completed_this_week' => 0,
            'high_priority_tasks' => 0,
            'overdue_tasks' => 0,
            'total_maintenance' => 0,
            'total_inspections' => 0
        ];
    }
}

/**
 * Get priority tasks requiring attention (both maintenance and inspections)
 */
function getPriorityTasks($pdo, $operatorId) {
    try {
        // Get priority maintenance tasks
        $maintenanceStmt = $pdo->prepare("
            SELECT mr.*, dp.name as drainage_point_name, dp.latitude, dp.longitude,
                   'Maintenance' as task_category, mr.request_type as task_type
            FROM maintenance_requests mr
            LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
            WHERE mr.assigned_to = ? 
            AND mr.status NOT IN ('Completed', 'Cancelled')
            AND (mr.priority IN ('High', 'Critical') OR mr.scheduled_date < CURDATE())
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
        
        // Get priority inspection tasks
        $inspectionStmt = $pdo->prepare("
            SELECT ins.*, dp.name as drainage_point_name, dp.latitude, dp.longitude,
                   'Inspection' as task_category, ins.inspection_type as task_type
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.operator_id = ? 
            AND ins.status NOT IN ('Completed', 'Cancelled')
            AND (ins.priority IN ('High', 'Critical') OR ins.scheduled_date < CURDATE())
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
        
        // Combine and sort by priority and date
        $allTasks = array_merge($maintenanceTasks, $inspectionTasks);
        
        // Sort combined tasks
        usort($allTasks, function($a, $b) {
            $priorityOrder = ['Critical' => 1, 'High' => 2, 'Medium' => 3, 'Low' => 4];
            $aPriority = $priorityOrder[$a['priority']] ?? 5;
            $bPriority = $priorityOrder[$b['priority']] ?? 5;
            
            if ($aPriority === $bPriority) {
                return strtotime($a['scheduled_date']) - strtotime($b['scheduled_date']);
            }
            return $aPriority - $bPriority;
        });
        
        return array_slice($allTasks, 0, 5);
        
    } catch (Exception $e) {
        error_log("Error getting priority tasks: " . $e->getMessage());
        return [];
    }
}

/**
 * Get today's scheduled tasks (both maintenance and inspections)
 */
function getTodaySchedule($pdo, $operatorId) {
    try {
        // Get today's maintenance tasks
        $maintenanceStmt = $pdo->prepare("
            SELECT mr.*, dp.name as drainage_point_name, dp.latitude, dp.longitude,
                   'Maintenance' as task_category, mr.request_type as task_type
            FROM maintenance_requests mr
            LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
            WHERE mr.assigned_to = ? 
            AND mr.scheduled_date = CURDATE()
            AND mr.status NOT IN ('Completed', 'Cancelled')
        ");
        
        $maintenanceStmt->execute([$operatorId]);
        $maintenanceTasks = $maintenanceStmt->fetchAll();
        
        // Get today's inspection tasks
        $inspectionStmt = $pdo->prepare("
            SELECT ins.*, dp.name as drainage_point_name, dp.latitude, dp.longitude,
                   'Inspection' as task_category, ins.inspection_type as task_type
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.operator_id = ? 
            AND ins.scheduled_date = CURDATE()
            AND ins.status NOT IN ('Completed', 'Cancelled')
        ");
        
        $inspectionStmt->execute([$operatorId]);
        $inspectionTasks = $inspectionStmt->fetchAll();
        
        // Combine and sort by scheduled time
        $allTasks = array_merge($maintenanceTasks, $inspectionTasks);
        
        usort($allTasks, function($a, $b) {
            $aTime = $a['scheduled_time'] ?? '09:00:00';
            $bTime = $b['scheduled_time'] ?? '09:00:00';
            return strcmp($aTime, $bTime);
        });
        
        return $allTasks;
        
    } catch (Exception $e) {
        error_log("Error getting today's schedule: " . $e->getMessage());
        return [];
    }
}

/**
 * Get recent activities (both maintenance and inspections)
 */
function getRecentActivities($pdo, $operatorId) {
    try {
        // Get recent maintenance activities
        $maintenanceStmt = $pdo->prepare("
            SELECT mr.*, dp.name as drainage_point_name,
                   'Maintenance' as task_category, mr.request_type as task_type
            FROM maintenance_requests mr
            LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
            WHERE mr.assigned_to = ?
            ORDER BY mr.updated_at DESC
            LIMIT 5
        ");
        
        $maintenanceStmt->execute([$operatorId]);
        $maintenanceActivities = $maintenanceStmt->fetchAll();
        
        // Get recent inspection activities
        $inspectionStmt = $pdo->prepare("
            SELECT ins.*, dp.name as drainage_point_name,
                   'Inspection' as task_category, ins.inspection_type as task_type
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.operator_id = ?
            ORDER BY ins.updated_at DESC
            LIMIT 5
        ");
        
        $inspectionStmt->execute([$operatorId]);
        $inspectionActivities = $inspectionStmt->fetchAll();
        
        // Combine and sort by updated_at
        $allActivities = array_merge($maintenanceActivities, $inspectionActivities);
        
        usort($allActivities, function($a, $b) {
            return strtotime($b['updated_at']) - strtotime($a['updated_at']);
        });
        
        // Format the activities for frontend
        return array_map(function($activity) {
            return [
                'id' => $activity['id'],
                'drainage_point_name' => $activity['drainage_point_name'] ?? 'Unknown Location',
                'task_type' => $activity['task_type'] ?? 'Task',
                'task_category' => $activity['task_category'],
                'status' => $activity['status'],
                'priority' => $activity['priority'],
                'scheduled_date' => $activity['scheduled_date'],
                'updated_at' => $activity['updated_at']
            ];
        }, array_slice($allActivities, 0, 10));
        
    } catch (Exception $e) {
        error_log("Error getting recent activities: " . $e->getMessage());
        return [];
    }
}

/**
 * Get work progress data for charts (combined maintenance and inspections)
 */
function getWorkProgress($pdo, $operatorId) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                DATE(scheduled_date) as work_date,
                COUNT(CASE WHEN status = 'Completed' AND task_category = 'Maintenance' THEN 1 END) as completed_maintenance,
                COUNT(CASE WHEN status = 'Completed' AND task_category = 'Inspection' THEN 1 END) as completed_inspections,
                COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_tasks,
                COUNT(*) as total_tasks
            FROM (
                SELECT scheduled_date, status, 'Maintenance' as task_category
                FROM maintenance_requests 
                WHERE assigned_to = ?
                UNION ALL
                SELECT scheduled_date, status, 'Inspection' as task_category
                FROM inspection_schedules 
                WHERE operator_id = ?
            ) combined_tasks
            WHERE scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
            GROUP BY DATE(scheduled_date)
            ORDER BY work_date
        ");
        
        $stmt->execute([$operatorId, $operatorId]);
        $progress = $stmt->fetchAll();
        
        // If no data, provide sample data for chart
        if (empty($progress)) {
            return [
                ['completed_tasks' => 0, 'total_tasks' => 0, 'completed_maintenance' => 0, 'completed_inspections' => 0],
                ['completed_tasks' => 1, 'total_tasks' => 2, 'completed_maintenance' => 1, 'completed_inspections' => 0],
                ['completed_tasks' => 2, 'total_tasks' => 3, 'completed_maintenance' => 1, 'completed_inspections' => 1],
                ['completed_tasks' => 1, 'total_tasks' => 1, 'completed_maintenance' => 0, 'completed_inspections' => 1]
            ];
        }
        
        return $progress;
        
    } catch (Exception $e) {
        error_log("Error getting work progress: " . $e->getMessage());
        return [
            ['completed_tasks' => 0, 'total_tasks' => 0, 'completed_maintenance' => 0, 'completed_inspections' => 0],
            ['completed_tasks' => 1, 'total_tasks' => 2, 'completed_maintenance' => 1, 'completed_inspections' => 0],
            ['completed_tasks' => 2, 'total_tasks' => 3, 'completed_maintenance' => 1, 'completed_inspections' => 1],
            ['completed_tasks' => 1, 'total_tasks' => 1, 'completed_maintenance' => 0, 'completed_inspections' => 1]
        ];
    }
}

/**
 * Get enhanced operator notifications including inspection reminders
 */
function getEnhancedOperatorNotifications($pdo, $operatorId) {
    try {
        $notifications = [];
        
        // Get maintenance task reminder notifications
        $maintenanceStmt = $pdo->prepare("
            SELECT 
                mr.id,
                CONCAT('Maintenance: ', mr.request_type, ' for ', COALESCE(dp.name, 'Unknown Location')) as title,
                mr.priority,
                CONCAT('Maintenance task scheduled for ', mr.scheduled_date) as message,
                'task_reminder' as type,
                mr.updated_at as created_at,
                0 as is_read
            FROM maintenance_requests mr
            LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
            WHERE mr.assigned_to = ? 
            AND mr.scheduled_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 2 DAY)
            AND mr.status = 'Pending'
            ORDER BY mr.updated_at DESC
            LIMIT 3
        ");
        
        $maintenanceStmt->execute([$operatorId]);
        $maintenanceNotifications = $maintenanceStmt->fetchAll();
        
        // Get inspection reminder notifications
        $inspectionStmt = $pdo->prepare("
            SELECT 
                ins.id,
                CONCAT('Inspection: ', ins.inspection_type, ' for ', COALESCE(dp.name, 'Unknown Location')) as title,
                ins.priority,
                CONCAT('Inspection scheduled for ', ins.scheduled_date, ' at ', ins.scheduled_time) as message,
                'inspection_reminder' as type,
                ins.updated_at as created_at,
                0 as is_read
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.operator_id = ? 
            AND ins.scheduled_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 2 DAY)
            AND ins.status = 'Scheduled'
            ORDER BY ins.updated_at DESC
            LIMIT 3
        ");
        
        $inspectionStmt->execute([$operatorId]);
        $inspectionNotifications = $inspectionStmt->fetchAll();
        
        // Combine notifications
        $allNotifications = array_merge($maintenanceNotifications, $inspectionNotifications);
        
        foreach ($allNotifications as $notification) {
            $notifications[] = [
                'id' => $notification['id'],
                'title' => $notification['title'],
                'message' => $notification['message'],
                'type' => $notification['type'],
                'created_at' => $notification['created_at'],
                'is_read' => false
            ];
        }
        
        // Add welcome notification if no other notifications
        if (empty($notifications)) {
            $notifications[] = [
                'id' => 1,
                'title' => 'Welcome to Enhanced DrainTrack',
                'message' => 'You can now manage both maintenance tasks and inspections from your dashboard.',
                'type' => 'system',
                'created_at' => date('Y-m-d H:i:s'),
                'is_read' => false
            ];
        }
        
        // Sort by created_at desc
        usort($notifications, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        return array_slice($notifications, 0, 5);
        
    } catch (Exception $e) {
        error_log("Error getting enhanced notifications: " . $e->getMessage());
        return [
            [
                'id' => 1,
                'title' => 'Welcome to Enhanced DrainTrack',
                'message' => 'You can now manage both maintenance tasks and inspections.',
                'type' => 'system',
                'created_at' => date('Y-m-d H:i:s'),
                'is_read' => false
            ]
        ];
    }
}

/**
 * Get enhanced operator performance metrics
 */
function getEnhancedPerformanceMetrics($pdo, $operatorId) {
    try {
        // Get maintenance performance
        $maintenanceStmt = $pdo->prepare("
            SELECT 
                COUNT(*) as maintenance_completed,
                COALESCE(AVG(CASE WHEN completion_date <= scheduled_date THEN 1 ELSE 0 END) * 100, 0) as maintenance_on_time_rate
            FROM maintenance_requests 
            WHERE assigned_to = ? 
            AND status = 'Completed'
            AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
        ");
        
        $maintenanceStmt->execute([$operatorId]);
        $maintenanceMetrics = $maintenanceStmt->fetch();
        
        // Get inspection performance
        $inspectionStmt = $pdo->prepare("
            SELECT 
                COUNT(*) as inspections_completed,
                COALESCE(AVG(CASE WHEN completion_date <= scheduled_date THEN 1 ELSE 0 END) * 100, 0) as inspection_on_time_rate
            FROM inspection_schedules 
            WHERE operator_id = ? 
            AND status = 'Completed'
            AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
        ");
        
        $inspectionStmt->execute([$operatorId]);
        $inspectionMetrics = $inspectionStmt->fetch();
        
        $totalCompleted = ($maintenanceMetrics['maintenance_completed'] ?? 0) + ($inspectionMetrics['inspections_completed'] ?? 0);
        $avgOnTimeRate = 0;
        
        if ($totalCompleted > 0) {
            $weightedRate = (($maintenanceMetrics['maintenance_completed'] ?? 0) * ($maintenanceMetrics['maintenance_on_time_rate'] ?? 0) +
                           ($inspectionMetrics['inspections_completed'] ?? 0) * ($inspectionMetrics['inspection_on_time_rate'] ?? 0)) / $totalCompleted;
            $avgOnTimeRate = round($weightedRate, 1);
        }
        
        return [
            'total_completed' => $totalCompleted,
            'maintenance_completed' => $maintenanceMetrics['maintenance_completed'] ?? 0,
            'inspections_completed' => $inspectionMetrics['inspections_completed'] ?? 0,
            'on_time_completion_rate' => $avgOnTimeRate,
            'maintenance_on_time_rate' => round($maintenanceMetrics['maintenance_on_time_rate'] ?? 0, 1),
            'inspection_on_time_rate' => round($inspectionMetrics['inspection_on_time_rate'] ?? 0, 1)
        ];
        
    } catch (Exception $e) {
        error_log("Error getting enhanced performance metrics: " . $e->getMessage());
        return [
            'total_completed' => 0,
            'maintenance_completed' => 0,
            'inspections_completed' => 0,
            'on_time_completion_rate' => 0,
            'maintenance_on_time_rate' => 0,
            'inspection_on_time_rate' => 0
        ];
    }
}

// Handle GET request - Get enhanced dashboard data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = initializeDatabase($config);
        
        $dashboardData = [
            'statistics' => getEnhancedOperatorStatistics($pdo, $operatorId),
            'priority_tasks' => getPriorityTasks($pdo, $operatorId),
            'today_schedule' => getTodaySchedule($pdo, $operatorId),
            'recent_activities' => getRecentActivities($pdo, $operatorId),
            'work_progress' => getWorkProgress($pdo, $operatorId),
            'notifications' => getEnhancedOperatorNotifications($pdo, $operatorId),
            'performance' => getEnhancedPerformanceMetrics($pdo, $operatorId)
        ];
        
        echo json_encode([
            'success' => true,
            'data' => $dashboardData,
            'operator' => [
                'id' => $_SESSION['user_id'],
                'name' => $_SESSION['user_name'],
                'email' => $_SESSION['user_email'],
                'role' => $_SESSION['user_role']
            ],
            'enhanced_features' => [
                'inspection_management' => true,
                'combined_task_view' => true,
                'enhanced_statistics' => true
            ],
            'timestamp' => date('c')
        ]);
        
    } catch (Exception $e) {
        error_log("Enhanced dashboard error: " . $e->getMessage());
        
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Error fetching enhanced dashboard data: ' . $e->getMessage(),
            'debug_info' => [
                'operator_id' => $operatorId,
                'error_type' => get_class($e),
                'timestamp' => date('c')
            ]
        ]);
    }
    exit;
}

// Handle POST request - Update operator preferences or quick actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
            exit;
        }
        
        $pdo = initializeDatabase($config);
        
        if (isset($data['action']) && $data['action'] === 'quick_update') {
            // Quick task status update from dashboard
            if (!isset($data['task_id'], $data['status'], $data['task_category'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Task ID, status, and category are required']);
                exit;
            }
            
            $taskId = (int)$data['task_id'];
            $status = $data['status'];
            $taskCategory = $data['task_category'];
            
            if ($taskCategory === 'Maintenance') {
                // Verify maintenance task belongs to operator
                $stmt = $pdo->prepare("SELECT id FROM maintenance_requests WHERE id = ? AND assigned_to = ?");
                $stmt->execute([$taskId, $operatorId]);
                
                if (!$stmt->fetch()) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Maintenance task not found or not assigned to you']);
                    exit;
                }
                
                $updateSql = "UPDATE maintenance_requests SET status = ?, updated_at = NOW()";
                $params = [$status];
                
                if ($status === 'Completed') {
                    $updateSql .= ", completion_date = CURDATE()";
                }
                $updateSql .= " WHERE id = ?";
                $params[] = $taskId;
                
            } else if ($taskCategory === 'Inspection') {
                // Verify inspection task belongs to operator
                $stmt = $pdo->prepare("SELECT id FROM inspection_schedules WHERE id = ? AND operator_id = ?");
                $stmt->execute([$taskId, $operatorId]);
                
                if (!$stmt->fetch()) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Inspection task not found or not assigned to you']);
                    exit;
                }
                
                $updateSql = "UPDATE inspection_schedules SET status = ?, updated_at = NOW()";
                $params = [$status];
                
                if ($status === 'Completed') {
                    $updateSql .= ", completion_date = CURDATE()";
                } else if ($status === 'In Progress') {
                    $updateSql .= ", start_time = NOW()";
                }
                $updateSql .= " WHERE id = ?";
                $params[] = $taskId;
                
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid task category']);
                exit;
            }
            
            $stmt = $pdo->prepare($updateSql);
            if ($stmt->execute($params)) {
                echo json_encode(['success' => true, 'message' => 'Task status updated successfully']);
            } else {
                throw new Exception('Failed to update task status');
            }
            
        } else if (isset($data['action']) && $data['action'] === 'mark_notification_read') {
            // Mark notification as read - for now just return success
            echo json_encode(['success' => true, 'message' => 'Notification marked as read']);
            
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action specified']);
        }
        
    } catch (Exception $e) {
        error_log("POST request error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error processing request: ' . $e->getMessage()]);
    }
    exit;
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>