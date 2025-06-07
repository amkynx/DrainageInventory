<?php
/**
 * DrainTrack Inspector Tasks API
 * Handles inspector task management with centralized authentication
 * 
 * @author DrainTrack Systems
 * @version 1.0
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
 * Start an inspection
 */
function startInspection($pdo, $inspectorId, $inspectionId, $notes = '') {
    try {
        // Verify inspection belongs to inspector
        $stmt = $pdo->prepare("
            SELECT id, status FROM inspection_schedules 
            WHERE id = ? AND inspector_id = ?
        ");
        $stmt->execute([$inspectionId, $inspectorId]);
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
                start_time = NOW(),
                updated_at = NOW(),
                notes = ?
            WHERE id = ?
        ");
        
        $stmt->execute([$notes, $inspectionId]);
        
        // Log activity
        logInspectionActivity($pdo, $inspectionId, $inspectorId, 'started', $notes);
        
        return ['success' => true, 'message' => 'Inspection started successfully'];
        
    } catch (Exception $e) {
        throw new Exception('Failed to start inspection: ' . $e->getMessage());
    }
}

/**
 * Complete an inspection
 */
function completeInspection($pdo, $inspectorId, $data) {
    try {
        $inspectionId = $data['inspection_id'];
        $findings = $data['findings'];
        $recommendations = $data['recommendations'] ?? '';
        $conditionRating = $data['condition_rating'] ?? 'Good';
        $maintenanceRequired = $data['maintenance_required'] ?? 'None';
        $createMaintenanceRequest = $data['create_maintenance_request'] ?? false;
        
        // Verify inspection belongs to inspector
        $stmt = $pdo->prepare("
            SELECT id, status, drainage_point_id FROM inspection_schedules 
            WHERE id = ? AND inspector_id = ?
        ");
        $stmt->execute([$inspectionId, $inspectorId]);
        $inspection = $stmt->fetch();
        
        if (!$inspection) {
            throw new Exception('Inspection not found or not assigned to you');
        }
        
        if ($inspection['status'] !== 'In Progress') {
            throw new Exception('Inspection cannot be completed - current status: ' . $inspection['status']);
        }
        
        // Begin transaction
        $pdo->beginTransaction();
        
        // Update inspection status
        $stmt = $pdo->prepare("
            UPDATE inspection_schedules 
            SET status = 'Completed',
                completion_date = NOW(),
                end_time = NOW(),
                findings = ?,
                recommendations = ?,
                condition_rating = ?,
                maintenance_required = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([
            $findings, 
            $recommendations, 
            $conditionRating, 
            $maintenanceRequired, 
            $inspectionId
        ]);
        
        // Update drainage point condition if applicable
        if ($conditionRating && $inspection['drainage_point_id']) {
            $newStatus = mapConditionToStatus($conditionRating);
            $stmt = $pdo->prepare("
                UPDATE drainage_points 
                SET status = ?, last_inspection_date = CURDATE(), updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$newStatus, $inspection['drainage_point_id']]);
        }
        
        // Create maintenance request if requested
        if ($createMaintenanceRequest && $maintenanceRequired !== 'None') {
            createMaintenanceRequest($pdo, $inspection['drainage_point_id'], $maintenanceRequired, $findings, $recommendations);
        }
        
        // Log activity
        logInspectionActivity($pdo, $inspectionId, $inspectorId, 'completed', $findings);
        
        $pdo->commit();
        
        return ['success' => true, 'message' => 'Inspection completed successfully'];
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw new Exception('Failed to complete inspection: ' . $e->getMessage());
    }
}

/**
 * Schedule a new inspection
 */
function scheduleInspection($pdo, $inspectorId, $data) {
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
        
        // Insert new inspection
        $stmt = $pdo->prepare("
            INSERT INTO inspection_schedules (
                drainage_point_id, inspector_id, inspection_type, 
                scheduled_date, scheduled_time, priority, frequency, 
                description, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', NOW(), NOW())
        ");
        
        $stmt->execute([
            $drainagePointId, $inspectorId, $inspectionType,
            $scheduledDate, $scheduledTime, $priority, 
            $frequency, $description
        ]);
        
        $inspectionId = $pdo->lastInsertId();
        
        // Log activity
        logInspectionActivity($pdo, $inspectionId, $inspectorId, 'scheduled', $description);
        
        return [
            'success' => true, 
            'message' => 'Inspection scheduled successfully',
            'inspection_id' => $inspectionId
        ];
        
    } catch (Exception $e) {
        throw new Exception('Failed to schedule inspection: ' . $e->getMessage());
    }
}

/**
 * Submit an issue report
 */
function submitIssueReport($pdo, $inspectorId, $data) {
    try {
        $location = $data['location'];
        $issueType = $data['issue_type'];
        $priority = $data['priority'] ?? 'Medium';
        $description = $data['description'];
        
        // Validate required fields
        if (!$location || !$issueType || !$description) {
            throw new Exception('Missing required fields: location, issue_type, description');
        }
        
        // Insert issue report
        $stmt = $pdo->prepare("
            INSERT INTO issue_reports (
                reported_by, location, issue_type, priority, 
                description, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'Open', NOW(), NOW())
        ");
        
        $stmt->execute([$inspectorId, $location, $issueType, $priority, $description]);
        
        $reportId = $pdo->lastInsertId();
        
        return [
            'success' => true, 
            'message' => 'Issue report submitted successfully',
            'report_id' => $reportId
        ];
        
    } catch (Exception $e) {
        throw new Exception('Failed to submit issue report: ' . $e->getMessage());
    }
}

/**
 * Create maintenance request based on inspection findings
 */
function createMaintenanceRequest($pdo, $drainagePointId, $maintenanceType, $findings, $recommendations) {
    try {
        $priority = mapMaintenanceTypeToPriority($maintenanceType);
        $description = "Based on inspection findings: " . $findings;
        if ($recommendations) {
            $description .= "\n\nRecommendations: " . $recommendations;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO maintenance_requests (
                drainage_point_id, request_type, priority, description,
                status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'Pending', NOW(), NOW())
        ");
        
        $stmt->execute([
            $drainagePointId,
            $maintenanceType,
            $priority,
            $description
        ]);
        
        return $pdo->lastInsertId();
        
    } catch (Exception $e) {
        error_log("Failed to create maintenance request: " . $e->getMessage());
        return null;
    }
}

/**
 * Log inspection activity
 */
function logInspectionActivity($pdo, $inspectionId, $inspectorId, $action, $notes = '') {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO inspection_activity_log (
                inspection_id, inspector_id, action, notes, created_at
            ) VALUES (?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([$inspectionId, $inspectorId, $action, $notes]);
        
    } catch (Exception $e) {
        error_log("Failed to log inspection activity: " . $e->getMessage());
    }
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

/**
 * Map maintenance type to priority
 */
function mapMaintenanceTypeToPriority($maintenanceType) {
    $priorityMap = [
        'None' => 'Low',
        'Routine' => 'Medium',
        'Urgent' => 'High',
        'Emergency' => 'Critical'
    ];
    
    return $priorityMap[$maintenanceType] ?? 'Medium';
}

// Handle GET request - Get inspector tasks
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = initializeDatabase($config);
        
        // Get inspector's assigned tasks/inspections
        $stmt = $pdo->prepare("
            SELECT ins.*, dp.name as drainage_point_name
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            WHERE ins.inspector_id = ?
            AND ins.status NOT IN ('Completed', 'Cancelled')
            ORDER BY ins.scheduled_date ASC, ins.scheduled_time ASC
        ");
        
        $stmt->execute([$inspectorId]);
        $tasks = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'tasks' => $tasks,
            'count' => count($tasks),
            'timestamp' => date('c')
        ]);
        
    } catch (Exception $e) {
        error_log("Inspector tasks error: " . $e->getMessage());
        
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Error fetching tasks: ' . $e->getMessage()
        ]);
    }
    exit;
}

// Handle POST request - Create new tasks or actions
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
        $action = $data['action'] ?? '';
        
        switch ($action) {
            case 'schedule_inspection':
                $result = scheduleInspection($pdo, $inspectorId, $data);
                break;
                
            case 'submit_issue_report':
                $result = submitIssueReport($pdo, $inspectorId, $data);
                break;
                
            default:
                throw new Exception('Invalid or missing action');
        }
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        error_log("Inspector tasks POST error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// Handle PUT request - Update existing tasks
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
                $result = startInspection($pdo, $inspectorId, $data['inspection_id'], $data['notes'] ?? '');
                break;
                
            case 'complete_inspection':
                $result = completeInspection($pdo, $inspectorId, $data);
                break;
                
            default:
                throw new Exception('Invalid or missing action');
        }
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        error_log("Inspector tasks PUT error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>