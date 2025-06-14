<?php
/**
 * DrainTrack Enhanced Operator Notifications API
 * Provides real-time notifications for operators about tasks, updates, and system events
 * 
 * @author DrainTrack Systems
 * @version 2.0 (Database-Integrated)
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
 * Get all notifications for the operator
 */
function getOperatorNotifications($pdo, $operatorId, $limit = 50, $unreadOnly = false) {
    try {
        $notifications = [];
        
        // Get explicit operator notifications (if table exists)
        try {
            $sql = "SELECT * FROM operator_notifications WHERE operator_id = ?";
            if ($unreadOnly) {
                $sql .= " AND is_read = 0";
            }
            $sql .= " ORDER BY created_at DESC LIMIT ?";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$operatorId, $limit]);
            $explicitNotifications = $stmt->fetchAll();
            
            foreach ($explicitNotifications as $notification) {
                $notifications[] = [
                    'id' => 'explicit_' . $notification['id'],
                    'title' => $notification['title'],
                    'message' => $notification['message'],
                    'type' => $notification['type'] ?? 'info',
                    'priority' => $notification['priority'] ?? 'normal',
                    'is_read' => (bool)$notification['is_read'],
                    'created_at' => $notification['created_at'],
                    'source' => 'system',
                    'action_url' => $notification['action_url'] ?? null,
                    'data' => json_decode($notification['data'] ?? '{}', true)
                ];
            }
        } catch (Exception $e) {
            // Table might not exist, continue with other notifications
        }
        
        // Generate task-based notifications
        $taskNotifications = generateTaskNotifications($pdo, $operatorId);
        $notifications = array_merge($notifications, $taskNotifications);
        
        // Generate schedule-based notifications
        $scheduleNotifications = generateScheduleNotifications($pdo, $operatorId);
        $notifications = array_merge($notifications, $scheduleNotifications);
        
        // Generate system notifications
        $systemNotifications = generateSystemNotifications($pdo, $operatorId);
        $notifications = array_merge($notifications, $systemNotifications);
        
        // Sort by priority and date
        usort($notifications, function($a, $b) {
            $priorityOrder = ['critical' => 1, 'high' => 2, 'normal' => 3, 'low' => 4];
            $aPriority = $priorityOrder[$a['priority']] ?? 3;
            $bPriority = $priorityOrder[$b['priority']] ?? 3;
            
            if ($aPriority === $bPriority) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            }
            return $aPriority - $bPriority;
        });
        
        // Apply limit and unread filter
        if ($unreadOnly) {
            $notifications = array_filter($notifications, function($n) {
                return !$n['is_read'];
            });
        }
        
        return array_slice($notifications, 0, $limit);
        
    } catch (Exception $e) {
        error_log("Error getting operator notifications: " . $e->getMessage());
        return [];
    }
}

/**
 * Generate task-based notifications
 */
function generateTaskNotifications($pdo, $operatorId) {
    $notifications = [];
    
    try {
        // Overdue tasks
        $overdueStmt = $pdo->prepare("
            SELECT mr.id, mr.request_number, mr.request_type, mr.priority, mr.scheduled_date, 
                   dp.name as location, 'Maintenance' as task_category
            FROM maintenance_requests mr
            LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
            WHERE mr.assigned_to = ? 
            AND mr.status NOT IN ('Completed', 'Cancelled')
            AND mr.scheduled_date < CURDATE()
            ORDER BY mr.scheduled_date ASC
        ");
        $overdueStmt->execute([$operatorId]);
        $overdueTasks = $overdueStmt->fetchAll();
        
        foreach ($overdueTasks as $task) {
            $daysOverdue = (strtotime('now') - strtotime($task['scheduled_date'])) / (60 * 60 * 24);
            $notifications[] = [
                'id' => 'overdue_maintenance_' . $task['id'],
                'title' => 'Overdue Task',
                'message' => "Maintenance task {$task['request_number']} at {$task['location']} is " . 
                           floor($daysOverdue) . " day(s) overdue",
                'type' => 'error',
                'priority' => $task['priority'] === 'Critical' ? 'critical' : 'high',
                'is_read' => false,
                'created_at' => date('Y-m-d H:i:s'),
                'source' => 'task_management',
                'action_url' => "/operator/tasks?task_id={$task['id']}",
                'data' => [
                    'task_id' => $task['id'],
                    'task_category' => $task['task_category'],
                    'days_overdue' => floor($daysOverdue)
                ]
            ];
        }
        
        // Due today tasks
        $dueTodayStmt = $pdo->prepare("
            SELECT mr.id, mr.request_number, mr.request_type, mr.priority, mr.scheduled_date,
                   dp.name as location, 'Maintenance' as task_category
            FROM maintenance_requests mr
            LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
            WHERE mr.assigned_to = ? 
            AND mr.status NOT IN ('Completed', 'Cancelled')
            AND mr.scheduled_date = CURDATE()
            
            UNION ALL
            
            SELECT ins.id, ins.schedule_number as request_number, ins.inspection_type as request_type, 
                   ins.priority, ins.scheduled_date, dp.name as location, 'Inspection' as task_category
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.operator_id = ? 
            AND ins.status NOT IN ('Completed', 'Cancelled')
            AND ins.scheduled_date = CURDATE()
        ");
        $dueTodayStmt->execute([$operatorId, $operatorId]);
        $dueTodayTasks = $dueTodayStmt->fetchAll();
        
        if (count($dueTodayTasks) > 0) {
            $notifications[] = [
                'id' => 'due_today_' . date('Y-m-d'),
                'title' => 'Tasks Due Today',
                'message' => "You have " . count($dueTodayTasks) . " task(s) scheduled for today",
                'type' => 'warning',
                'priority' => 'high',
                'is_read' => false,
                'created_at' => date('Y-m-d H:i:s'),
                'source' => 'schedule',
                'action_url' => '/operator/tasks?filter=due_today',
                'data' => ['task_count' => count($dueTodayTasks)]
            ];
        }
        
        // High priority tasks
        $highPriorityStmt = $pdo->prepare("
            SELECT mr.id, mr.request_number, mr.request_type, mr.priority, 
                   dp.name as location, 'Maintenance' as task_category
            FROM maintenance_requests mr
            LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
            WHERE mr.assigned_to = ? 
            AND mr.status NOT IN ('Completed', 'Cancelled')
            AND mr.priority IN ('Critical', 'High')
            ORDER BY 
                CASE mr.priority 
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                END,
                mr.scheduled_date ASC
            LIMIT 5
        ");
        $highPriorityStmt->execute([$operatorId]);
        $highPriorityTasks = $highPriorityStmt->fetchAll();
        
        foreach ($highPriorityTasks as $task) {
            if ($task['priority'] === 'Critical') {
                $notifications[] = [
                    'id' => 'critical_task_' . $task['id'],
                    'title' => 'Critical Task Alert',
                    'message' => "Critical maintenance required at {$task['location']} - {$task['request_type']}",
                    'type' => 'error',
                    'priority' => 'critical',
                    'is_read' => false,
                    'created_at' => date('Y-m-d H:i:s'),
                    'source' => 'priority_alert',
                    'action_url' => "/operator/tasks?task_id={$task['id']}",
                    'data' => [
                        'task_id' => $task['id'],
                        'task_category' => $task['task_category'],
                        'priority' => $task['priority']
                    ]
                ];
            }
        }
        
    } catch (Exception $e) {
        error_log("Error generating task notifications: " . $e->getMessage());
    }
    
    return $notifications;
}

/**
 * Generate schedule-based notifications
 */
function generateScheduleNotifications($pdo, $operatorId) {
    $notifications = [];
    
    try {
        // Upcoming inspections (next 3 days)
        $upcomingStmt = $pdo->prepare("
            SELECT ins.id, ins.schedule_number, ins.inspection_type, ins.scheduled_date, ins.scheduled_time,
                   dp.name as location
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.operator_id = ? 
            AND ins.status = 'Scheduled'
            AND ins.scheduled_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
            ORDER BY ins.scheduled_date ASC, ins.scheduled_time ASC
        ");
        $upcomingStmt->execute([$operatorId]);
        $upcomingInspections = $upcomingStmt->fetchAll();
        
        foreach ($upcomingInspections as $inspection) {
            $daysUntil = (strtotime($inspection['scheduled_date']) - strtotime(date('Y-m-d'))) / (60 * 60 * 24);
            $timeText = $daysUntil == 0 ? 'today' : ($daysUntil == 1 ? 'tomorrow' : "in " . $daysUntil . " days");
            
            $notifications[] = [
                'id' => 'upcoming_inspection_' . $inspection['id'],
                'title' => 'Upcoming Inspection',
                'message' => "Inspection {$inspection['schedule_number']} at {$inspection['location']} scheduled $timeText at {$inspection['scheduled_time']}",
                'type' => 'info',
                'priority' => $daysUntil <= 1 ? 'high' : 'normal',
                'is_read' => false,
                'created_at' => date('Y-m-d H:i:s'),
                'source' => 'schedule',
                'action_url' => "/operator/tasks?inspection_id={$inspection['id']}",
                'data' => [
                    'inspection_id' => $inspection['id'],
                    'scheduled_date' => $inspection['scheduled_date'],
                    'scheduled_time' => $inspection['scheduled_time'],
                    'days_until' => $daysUntil
                ]
            ];
        }
        
    } catch (Exception $e) {
        error_log("Error generating schedule notifications: " . $e->getMessage());
    }
    
    return $notifications;
}

/**
 * Generate system notifications
 */
function generateSystemNotifications($pdo, $operatorId) {
    $notifications = [];
    
    try {
        // Check for recent activity acknowledgments needed
        $recentCompletionsStmt = $pdo->prepare("
            SELECT COUNT(*) as completed_count
            FROM maintenance_requests mr
            WHERE mr.assigned_to = ? 
            AND mr.status = 'Completed'
            AND mr.completion_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        $recentCompletionsStmt->execute([$operatorId]);
        $recentCompletions = $recentCompletionsStmt->fetch();
        
        if ($recentCompletions['completed_count'] > 0) {
            $notifications[] = [
                'id' => 'weekly_summary_' . date('Y-W'),
                'title' => 'Weekly Summary',
                'message' => "Great work! You completed {$recentCompletions['completed_count']} task(s) this week",
                'type' => 'success',
                'priority' => 'low',
                'is_read' => false,
                'created_at' => date('Y-m-d H:i:s'),
                'source' => 'system',
                'action_url' => '/operator/reports',
                'data' => ['completed_count' => $recentCompletions['completed_count']]
            ];
        }
        
        // Check for pending issue reports
        $pendingIssuesStmt = $pdo->prepare("
            SELECT COUNT(*) as pending_count
            FROM operator_issue_reports oir
            WHERE oir.operator_id = ? 
            AND oir.status = 'Open'
        ");
        $pendingIssuesStmt->execute([$operatorId]);
        $pendingIssues = $pendingIssuesStmt->fetch();
        
        if ($pendingIssues['pending_count'] > 0) {
            $notifications[] = [
                'id' => 'pending_issues_' . date('Y-m-d'),
                'title' => 'Pending Issue Reports',
                'message' => "You have {$pendingIssues['pending_count']} pending issue report(s) awaiting review",
                'type' => 'info',
                'priority' => 'normal',
                'is_read' => false,
                'created_at' => date('Y-m-d H:i:s'),
                'source' => 'system',
                'action_url' => '/operator/issues',
                'data' => ['pending_count' => $pendingIssues['pending_count']]
            ];
        }
        
    } catch (Exception $e) {
        error_log("Error generating system notifications: " . $e->getMessage());
    }
    
    return $notifications;
}

/**
 * Mark notification as read
 */
function markNotificationAsRead($pdo, $operatorId, $notificationId) {
    try {
        // Handle explicit notifications
        if (strpos($notificationId, 'explicit_') === 0) {
            $realId = str_replace('explicit_', '', $notificationId);
            $stmt = $pdo->prepare("
                UPDATE operator_notifications 
                SET is_read = 1, read_at = NOW() 
                WHERE id = ? AND operator_id = ?
            ");
            $stmt->execute([$realId, $operatorId]);
            return $stmt->rowCount() > 0;
        }
        
        // For generated notifications, we could store read states in a separate table
        // For now, return true as these are dynamically generated
        return true;
        
    } catch (Exception $e) {
        error_log("Error marking notification as read: " . $e->getMessage());
        return false;
    }
}

/**
 * Mark all notifications as read
 */
function markAllNotificationsAsRead($pdo, $operatorId) {
    try {
        // Mark explicit notifications as read
        $stmt = $pdo->prepare("
            UPDATE operator_notifications 
            SET is_read = 1, read_at = NOW() 
            WHERE operator_id = ? AND is_read = 0
        ");
        $stmt->execute([$operatorId]);
        
        return true;
        
    } catch (Exception $e) {
        error_log("Error marking all notifications as read: " . $e->getMessage());
        return false;
    }
}

/**
 * Get notification counts
 */
function getNotificationCounts($pdo, $operatorId) {
    try {
        $notifications = getOperatorNotifications($pdo, $operatorId, 100);
        
        $counts = [
            'total' => count($notifications),
            'unread' => 0,
            'critical' => 0,
            'high' => 0,
            'by_type' => [
                'error' => 0,
                'warning' => 0,
                'info' => 0,
                'success' => 0
            ]
        ];
        
        foreach ($notifications as $notification) {
            if (!$notification['is_read']) {
                $counts['unread']++;
            }
            
            if ($notification['priority'] === 'critical') {
                $counts['critical']++;
            } elseif ($notification['priority'] === 'high') {
                $counts['high']++;
            }
            
            $type = $notification['type'];
            if (isset($counts['by_type'][$type])) {
                $counts['by_type'][$type]++;
            }
        }
        
        return $counts;
        
    } catch (Exception $e) {
        error_log("Error getting notification counts: " . $e->getMessage());
        return ['total' => 0, 'unread' => 0, 'critical' => 0, 'high' => 0, 'by_type' => []];
    }
}

// Handle GET request - Get notifications
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = initializeDatabase($config);
        
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $unreadOnly = isset($_GET['unread_only']) && $_GET['unread_only'] === 'true';
        $countsOnly = isset($_GET['counts_only']) && $_GET['counts_only'] === 'true';
        
        if ($countsOnly) {
            $counts = getNotificationCounts($pdo, $operatorId);
            echo json_encode([
                'success' => true,
                'counts' => $counts
            ]);
        } else {
            $notifications = getOperatorNotifications($pdo, $operatorId, $limit, $unreadOnly);
            $counts = getNotificationCounts($pdo, $operatorId);
            
            echo json_encode([
                'success' => true,
                'notifications' => $notifications,
                'counts' => $counts,
                'total_notifications' => count($notifications),
                'operator' => [
                    'id' => $_SESSION['user_id'],
                    'name' => $_SESSION['user_name'] ?? ($_SESSION['first_name'] . ' ' . $_SESSION['last_name']),
                    'role' => $_SESSION['user_role']
                ]
            ]);
        }
        
    } catch (Exception $e) {
        error_log("Operator notifications GET error: " . $e->getMessage());
        
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Error fetching notifications: ' . $e->getMessage()
        ]);
    }
    exit;
}

// Handle PUT request - Mark notifications as read
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
        
        if ($action === 'mark_all_read') {
            $result = markAllNotificationsAsRead($pdo, $operatorId);
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'All notifications marked as read' : 'Failed to mark notifications as read'
            ]);
        } elseif ($action === 'mark_read' && isset($data['notification_id'])) {
            $result = markNotificationAsRead($pdo, $operatorId, $data['notification_id']);
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Notification marked as read' : 'Failed to mark notification as read'
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action or missing parameters']);
        }
        
    } catch (Exception $e) {
        error_log("Operator notifications PUT error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>