<?php
/**
 * DrainTrack - Completion Reports API
 * Handles CRUD operations for completion reports
 * 
 * @author DrainTrack Systems
 * @version 1.0
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Please login']);
    exit();
}

// Database configuration - try multiple common configurations
$possible_configs = [
    [
        'host' => 'localhost',
        'dbname' => 'drainageinventory',
        'username' => 'root',
        'password' => ''
    ],
    [
        'host' => 'localhost',
        'dbname' => 'draintrack',
        'username' => 'root',
        'password' => ''
    ],
    [
        'host' => '127.0.0.1',
        'dbname' => 'drainageinventory',
        'username' => 'root',
        'password' => ''
    ]
];

$pdo = null;
$connection_error = null;

// Try each database configuration
foreach ($possible_configs as $config) {
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
        break; // Connection successful
    } catch (PDOException $e) {
        $connection_error = $e->getMessage();
        continue; // Try next configuration
    }
}

if (!$pdo) {
    error_log("Database connection failed: " . $connection_error);
    echo json_encode([
        'success' => false, 
        'message' => 'Database connection failed',
        'debug' => [
            'error' => $connection_error,
            'configs_tried' => count($possible_configs)
        ]
    ]);
    exit();
}

/**
 * Get all completion reports with enhanced data
 */
function getCompletionReports($pdo) {
    try {
        $reports = [];
        
        // Get completed maintenance requests
        $maintenanceQuery = "
            SELECT 
                mr.id,
                mr.request_number as task_number,
                mr.request_type as type_detail,
                mr.priority,
                mr.estimated_cost,
                mr.completion_date,
                mr.updated_at,
                mr.hours_worked,
                mr.work_summary,
                mr.completion_notes,
                mr.materials_used,
                mr.status,
                dp.name as location,
                CONCAT(u.first_name, ' ', u.last_name) as operator_name,
                'maintenance' as task_type
            FROM maintenance_requests mr
            LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
            LEFT JOIN users u ON mr.assigned_to = u.id
            WHERE mr.status = 'Completed'
            ORDER BY mr.completion_date DESC
        ";
        
        $stmt = $pdo->prepare($maintenanceQuery);
        $stmt->execute();
        $maintenanceReports = $stmt->fetchAll();
        
        // Get completed inspections
        $inspectionQuery = "
            SELECT 
                ins.id,
                CONCAT('IS-', ins.id) as task_number,
                ins.inspection_type as type_detail,
                ins.priority,
                NULL as estimated_cost,
                ins.completion_date,
                ins.updated_at,
                ins.hours_worked,
                ins.findings as work_summary,
                ins.recommendations as completion_notes,
                'Standard inspection tools' as materials_used,
                ins.status,
                dp.name as location,
                CONCAT(u.first_name, ' ', u.last_name) as operator_name,
                'inspection' as task_type
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            LEFT JOIN users u ON ins.operator_id = u.id
            WHERE ins.status = 'Completed'
            ORDER BY ins.completion_date DESC
        ";
        
        $stmt = $pdo->prepare($inspectionQuery);
        $stmt->execute();
        $inspectionReports = $stmt->fetchAll();
        
        // Combine and enhance reports
        $reports = array_merge($maintenanceReports, $inspectionReports);
        
        // Add status for completion reports (default to pending_review)
        foreach ($reports as &$report) {
            if (!isset($report['status']) || $report['status'] === 'Completed') {
                $report['status'] = 'pending_review';
            }
            
            // Add completion percentage
            $report['completion_percentage'] = 100;
            
            // Format task number
            if ($report['task_type'] === 'maintenance' && !str_starts_with($report['task_number'], 'MR-')) {
                $report['task_number'] = 'MR-' . $report['id'];
            } elseif ($report['task_type'] === 'inspection' && !str_starts_with($report['task_number'], 'IS-')) {
                $report['task_number'] = 'IS-' . $report['id'];
            }
        }
        
        // Sort by completion date (newest first)
        usort($reports, function($a, $b) {
            return strtotime($b['completion_date'] ?? $b['updated_at']) - strtotime($a['completion_date'] ?? $a['updated_at']);
        });
        
        // Calculate statistics
        $stats = [
            'total' => count($reports),
            'pending_review' => count(array_filter($reports, fn($r) => $r['status'] === 'pending_review')),
            'approved' => count(array_filter($reports, fn($r) => $r['status'] === 'approved')),
            'follow_up_required' => count(array_filter($reports, fn($r) => $r['status'] === 'follow_up_required'))
        ];
        
        return [
            'success' => true,
            'data' => $reports,
            'stats' => $stats,
            'total_count' => count($reports)
        ];
        
    } catch (Exception $e) {
        error_log("Error getting completion reports: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Error fetching completion reports: ' . $e->getMessage(),
            'data' => [],
            'stats' => ['total' => 0, 'pending_review' => 0, 'approved' => 0, 'follow_up_required' => 0]
        ];
    }
}

/**
 * Update completion report status (approve/follow-up)
 */
function updateCompletionReport($pdo, $data) {
    try {
        $reportId = $data['id'];
        $action = $data['action'];
        $notes = $data['notes'] ?? '';
        $reason = $data['reason'] ?? '';
        
        if (!$reportId || !$action) {
            throw new Exception('Report ID and action are required');
        }
        
        $pdo->beginTransaction();
        
        if ($action === 'approve') {
            $newStatus = 'approved';
            $message = 'Report approved successfully';
            
            // Try to update in both tables
            $maintenanceUpdate = "UPDATE maintenance_requests SET status = 'Approved', approval_notes = ?, approved_at = NOW(), approved_by = ? WHERE id = ?";
            $inspectionUpdate = "UPDATE inspection_schedules SET status = 'Approved', approval_notes = ?, approved_at = NOW(), approved_by = ? WHERE id = ?";
            
            $stmt1 = $pdo->prepare($maintenanceUpdate);
            $stmt1->execute([$notes, $_SESSION['user_id'], $reportId]);
            
            $stmt2 = $pdo->prepare($inspectionUpdate);
            $stmt2->execute([$notes, $_SESSION['user_id'], $reportId]);
            
        } elseif ($action === 'follow_up') {
            $newStatus = 'follow_up_required';
            $message = 'Follow-up requested successfully';
            
            // Update both tables for follow-up
            $maintenanceUpdate = "UPDATE maintenance_requests SET status = 'Follow-up Required', follow_up_reason = ?, follow_up_requested_at = NOW(), follow_up_requested_by = ? WHERE id = ?";
            $inspectionUpdate = "UPDATE inspection_schedules SET status = 'Follow-up Required', follow_up_reason = ?, follow_up_requested_at = NOW(), follow_up_requested_by = ? WHERE id = ?";
            
            $stmt1 = $pdo->prepare($maintenanceUpdate);
            $stmt1->execute([$reason, $_SESSION['user_id'], $reportId]);
            
            $stmt2 = $pdo->prepare($inspectionUpdate);
            $stmt2->execute([$reason, $_SESSION['user_id'], $reportId]);
            
        } else {
            throw new Exception('Invalid action specified');
        }
        
        // Log the activity
        $activitySql = "INSERT INTO user_activity_log (user_id, action, description, created_at) VALUES (?, ?, ?, NOW())";
        $activityStmt = $pdo->prepare($activitySql);
        $activityStmt->execute([
            $_SESSION['user_id'],
            "completion_report_{$action}",
            "Report ID {$reportId}: {$message}. " . ($notes ? "Notes: {$notes}" : '') . ($reason ? "Reason: {$reason}" : '')
        ]);
        
        $pdo->commit();
        
        return [
            'success' => true,
            'message' => $message,
            'new_status' => $newStatus
        ];
        
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Error updating completion report: " . $e->getMessage());
        throw new Exception('Failed to update completion report: ' . $e->getMessage());
    }
}

/**
 * Delete completion report (reset task status)
 */
function deleteCompletionReport($pdo, $reportId) {
    try {
        if (!$reportId) {
            throw new Exception('Report ID is required');
        }
        
        $pdo->beginTransaction();
        
        $updated = false;
        
        // Try to reset maintenance request status
        $maintenanceCheck = "SELECT id, status FROM maintenance_requests WHERE id = ? AND status = 'Completed'";
        $stmt = $pdo->prepare($maintenanceCheck);
        $stmt->execute([$reportId]);
        
        if ($stmt->fetch()) {
            $maintenanceReset = "UPDATE maintenance_requests SET 
                                status = 'In Progress',
                                completion_date = NULL,
                                work_summary = NULL,
                                completion_notes = NULL,
                                hours_worked = NULL,
                                updated_at = NOW()
                                WHERE id = ?";
            $stmt = $pdo->prepare($maintenanceReset);
            $stmt->execute([$reportId]);
            $updated = true;
        }
        
        // Try to reset inspection schedule status
        $inspectionCheck = "SELECT id, status FROM inspection_schedules WHERE id = ? AND status = 'Completed'";
        $stmt = $pdo->prepare($inspectionCheck);
        $stmt->execute([$reportId]);
        
        if ($stmt->fetch()) {
            $inspectionReset = "UPDATE inspection_schedules SET 
                               status = 'In Progress',
                               completion_date = NULL,
                               findings = NULL,
                               recommendations = NULL,
                               hours_worked = NULL,
                               updated_at = NOW()
                               WHERE id = ?";
            $stmt = $pdo->prepare($inspectionReset);
            $stmt->execute([$reportId]);
            $updated = true;
        }
        
        if (!$updated) {
            throw new Exception('No completion report found with ID: ' . $reportId);
        }
        
        // Log the deletion
        $activitySql = "INSERT INTO user_activity_log (user_id, action, description, created_at) VALUES (?, ?, ?, NOW())";
        $activityStmt = $pdo->prepare($activitySql);
        $activityStmt->execute([
            $_SESSION['user_id'],
            'completion_report_deleted',
            "Deleted completion report ID {$reportId} and reset task status"
        ]);
        
        $pdo->commit();
        
        return [
            'success' => true,
            'message' => 'Completion report deleted and task status reset successfully'
        ];
        
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Error deleting completion report: " . $e->getMessage());
        throw new Exception('Failed to delete completion report: ' . $e->getMessage());
    }
}

// Handle different HTTP methods
try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $result = getCompletionReports($pdo);
            echo json_encode($result);
            break;
            
        case 'PUT':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                throw new Exception('Invalid JSON data');
            }
            
            $result = updateCompletionReport($pdo, $data);
            echo json_encode($result);
            break;
            
        case 'DELETE':
            $reportId = $_GET['id'] ?? null;
            
            if (!$reportId) {
                throw new Exception('Report ID is required');
            }
            
            $result = deleteCompletionReport($pdo, $reportId);
            echo json_encode($result);
            break;
            
        case 'POST':
            // For future implementation of creating new completion reports
            http_response_code(501);
            echo json_encode([
                'success' => false,
                'message' => 'POST method not implemented yet'
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            break;
    }
    
} catch (Exception $e) {
    error_log("Completion reports API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'method' => $_SERVER['REQUEST_METHOD'],
            'request_data' => $_REQUEST ?? [],
            'session_user' => $_SESSION['user_id'] ?? 'not set'
        ]
    ]);
}
?>