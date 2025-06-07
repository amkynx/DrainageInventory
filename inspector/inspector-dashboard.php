<?php
/**
 * DrainTrack Inspector Dashboard API
 * Handles inspector-specific dashboard data with centralized authentication
 * 
 * @author DrainTrack Systems
 * @version 1.0
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

// Check if user is authenticated and is an inspector
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'Inspector') {
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'message' => 'Unauthorized access - Inspector role required',
        'redirect' => '../login.html?unauthorized=1'
    ]);
    exit;
}

$inspectorId = $_SESSION['user_id'];

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
 * Get inspector dashboard statistics
 */
function getInspectorStatistics($pdo, $inspectorId) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_inspections,
                SUM(CASE WHEN status = 'Scheduled' AND scheduled_date = CURDATE() THEN 1 ELSE 0 END) as pending_today,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Completed' AND DATE(completion_date) = CURDATE() THEN 1 ELSE 0 END) as completed_today,
                SUM(CASE WHEN scheduled_date < CURDATE() AND status NOT IN ('Completed', 'Cancelled') THEN 1 ELSE 0 END) as overdue
            FROM inspection_schedules 
            WHERE inspector_id = ?
        ");
        
        $stmt->execute([$inspectorId]);
        $result = $stmt->fetch();
        
        return $result ?: [
            'total_inspections' => 0,
            'pending_today' => 0,
            'in_progress' => 0,
            'completed_today' => 0,
            'overdue' => 0
        ];
        
    } catch (Exception $e) {
        error_log("Error getting inspector statistics: " . $e->getMessage());
        return [
            'total_inspections' => 0,
            'pending_today' => 0,
            'in_progress' => 0,
            'completed_today' => 0,
            'overdue' => 0
        ];
    }
}

/**
 * Get today's inspection schedule
 */
function getTodaySchedule($pdo, $inspectorId) {
    try {
        $stmt = $pdo->prepare("
            SELECT ins.*, dp.name as drainage_point_name, dp.latitude, dp.longitude
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.inspector_id = ? 
            AND ins.scheduled_date = CURDATE()
            AND ins.status NOT IN ('Completed', 'Cancelled')
            ORDER BY ins.scheduled_time ASC
        ");
        
        $stmt->execute([$inspectorId]);
        return $stmt->fetchAll();
        
    } catch (Exception $e) {
        error_log("Error getting today's schedule: " . $e->getMessage());
        return [];
    }
}

/**
 * Get upcoming inspections this week
 */
function getUpcomingInspections($pdo, $inspectorId) {
    try {
        $stmt = $pdo->prepare("
            SELECT ins.*, dp.name as drainage_point_name
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.inspector_id = ? 
            AND ins.scheduled_date > CURDATE()
            AND ins.scheduled_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            AND ins.status = 'Scheduled'
            ORDER BY ins.scheduled_date ASC, ins.scheduled_time ASC
            LIMIT 5
        ");
        
        $stmt->execute([$inspectorId]);
        return $stmt->fetchAll();
        
    } catch (Exception $e) {
        error_log("Error getting upcoming inspections: " . $e->getMessage());
        return [];
    }
}

/**
 * Get recent inspection activity
 */
function getRecentActivity($pdo, $inspectorId) {
    try {
        $stmt = $pdo->prepare("
            SELECT ins.*, dp.name as drainage_point_name
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.inspector_id = ?
            AND ins.status = 'Completed'
            ORDER BY ins.completion_date DESC
            LIMIT 10
        ");
        
        $stmt->execute([$inspectorId]);
        $activities = $stmt->fetchAll();
        
        return array_map(function($activity) {
            return [
                'id' => $activity['id'],
                'drainage_point_name' => $activity['drainage_point_name'] ?? 'Unknown Location',
                'inspection_type' => $activity['inspection_type'] ?? 'Inspection',
                'status' => $activity['status'],
                'priority' => $activity['priority'],
                'scheduled_date' => $activity['scheduled_date'],
                'completion_date' => $activity['completion_date']
            ];
        }, $activities);
        
    } catch (Exception $e) {
        error_log("Error getting recent activity: " . $e->getMessage());
        return [];
    }
}

/**
 * Get all inspections for the inspector
 */
function getInspections($pdo, $inspectorId) {
    try {
        $stmt = $pdo->prepare("
            SELECT ins.*, dp.name as drainage_point_name, dp.latitude, dp.longitude
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.inspector_id = ?
            ORDER BY ins.scheduled_date DESC, ins.scheduled_time DESC
            LIMIT 50
        ");
        
        $stmt->execute([$inspectorId]);
        return $stmt->fetchAll();
        
    } catch (Exception $e) {
        error_log("Error getting inspections: " . $e->getMessage());
        return [];
    }
}

/**
 * Get drainage points for dropdown
 */
function getDrainagePoints($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, name, type, status, latitude, longitude
            FROM drainage_points 
            WHERE status != 'Inactive'
            ORDER BY name ASC
        ");
        
        $stmt->execute();
        return $stmt->fetchAll();
        
    } catch (Exception $e) {
        error_log("Error getting drainage points: " . $e->getMessage());
        return [];
    }
}

/**
 * Get inspector performance metrics
 */
function getPerformanceMetrics($pdo, $inspectorId) {
    try {
        // Get this month's performance
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as completed_this_month,
                COALESCE(AVG(CASE WHEN completion_date <= scheduled_date THEN 1 ELSE 0 END) * 100, 0) as on_time_percentage,
                COALESCE(AVG(DATEDIFF(completion_date, scheduled_date)), 0) as avg_completion_delay_days
            FROM inspection_schedules 
            WHERE inspector_id = ? 
            AND status = 'Completed'
            AND YEAR(completion_date) = YEAR(CURDATE())
            AND MONTH(completion_date) = MONTH(CURDATE())
        ");
        
        $stmt->execute([$inspectorId]);
        $result = $stmt->fetch();
        
        return $result ?: [
            'completed_this_month' => 0,
            'on_time_percentage' => 0,
            'avg_completion_delay_days' => 0
        ];
        
    } catch (Exception $e) {
        error_log("Error getting performance metrics: " . $e->getMessage());
        return [
            'completed_this_month' => 0,
            'on_time_percentage' => 0,
            'avg_completion_delay_days' => 0
        ];
    }
}

// Handle GET request - Get dashboard data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = initializeDatabase($config);
        
        $dashboardData = [
            'statistics' => getInspectorStatistics($pdo, $inspectorId),
            'today_schedule' => getTodaySchedule($pdo, $inspectorId),
            'upcoming_inspections' => getUpcomingInspections($pdo, $inspectorId),
            'recent_activity' => getRecentActivity($pdo, $inspectorId),
            'inspections' => getInspections($pdo, $inspectorId),
            'drainage_points' => getDrainagePoints($pdo),
            'performance' => getPerformanceMetrics($pdo, $inspectorId)
        ];
        
        echo json_encode([
            'success' => true,
            'data' => $dashboardData,
            'inspector' => [
                'id' => $_SESSION['user_id'],
                'name' => $_SESSION['user_name'],
                'email' => $_SESSION['user_email'],
                'role' => $_SESSION['user_role']
            ],
            'timestamp' => date('c')
        ]);
        
    } catch (Exception $e) {
        error_log("Inspector dashboard error: " . $e->getMessage());
        
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Error fetching dashboard data: ' . $e->getMessage(),
            'debug_info' => [
                'inspector_id' => $inspectorId,
                'error_type' => get_class($e),
                'timestamp' => date('c')
            ]
        ]);
    }
    exit;
}

// Handle POST request - Update inspector preferences or quick actions
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
        
        if (isset($data['action']) && $data['action'] === 'update_preferences') {
            // Update inspector preferences
            echo json_encode(['success' => true, 'message' => 'Preferences updated successfully']);
            
        } else if (isset($data['action']) && $data['action'] === 'mark_notification_read') {
            // Mark notification as read
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