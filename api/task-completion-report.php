<?php
/**
 * DrainTrack - Task Completion Report API (FIXED VERSION)
 * Get detailed completion report with proper error handling
 * 
 * @author DrainTrack Systems  
 * @version 2.1 - FIXED JSON RESPONSE
 */

// DISABLE HTML ERROR OUTPUT - Critical for JSON APIs
error_reporting(0);
ini_set('display_errors', 0);

// Set JSON headers FIRST
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start output buffering to catch any unexpected output
ob_start();

try {
    // Start session if not already started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Check authentication
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Unauthorized - Please login', 401);
    }

    // Only allow GET requests
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception('Method not allowed', 405);
    }

    // Get and validate parameters
    $task_id = $_GET['task_id'] ?? null;
    $task_type = $_GET['task_type'] ?? 'maintenance';

    if (!$task_id) {
        throw new Exception('Task ID is required', 400);
    }

    // Clean task_id - remove any prefixes
    $task_id = preg_replace('/^(MR-|IS-)/', '', $task_id);

    if (!in_array($task_type, ['maintenance', 'inspection'])) {
        throw new Exception('Invalid task type. Must be "maintenance" or "inspection"', 400);
    }

    // Database configuration
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

    // Try database connections
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
            break;
        } catch (PDOException $e) {
            continue;
        }
    }

    if (!$pdo) {
        throw new Exception('Database connection failed', 500);
    }

    // Get task data based on type
    $task = null;
    
    if ($task_type === 'maintenance') {
        $sql = "
            SELECT 
                mr.id,
                mr.request_number,
                mr.drainage_point_id,
                mr.request_type,
                mr.priority,
                mr.status,
                mr.description,
                mr.estimated_cost,
                mr.actual_cost,
                mr.scheduled_date,
                mr.completion_date,
                mr.notes,
                mr.completion_notes,
                mr.work_summary,
                mr.hours_worked,
                mr.materials_used,
                mr.work_performed,
                mr.findings,
                mr.recommendations,
                mr.created_at,
                mr.updated_at,
                dp.name as drainage_point_name,
                CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as operator_name
            FROM maintenance_requests mr
            LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
            LEFT JOIN users u ON mr.assigned_to = u.id
            WHERE mr.id = ?
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$task_id]);
        $task = $stmt->fetch();
        
    } else if ($task_type === 'inspection') {
        $sql = "
            SELECT 
                ins.id,
                ins.schedule_number as request_number,
                ins.drainage_point_id,
                ins.inspection_type as request_type,
                ins.priority,
                ins.status,
                ins.description,
                NULL as estimated_cost,
                NULL as actual_cost,
                ins.scheduled_date,
                ins.completion_date,
                ins.findings as notes,
                ins.recommendations as completion_notes,
                ins.findings as work_summary,
                ins.hours_worked,
                'Standard inspection tools' as materials_used,
                ins.findings as work_performed,
                ins.findings,
                ins.recommendations,
                ins.created_at,
                ins.updated_at,
                dp.name as drainage_point_name,
                CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as operator_name
            FROM inspection_schedules ins
            LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
            LEFT JOIN users u ON ins.operator_id = u.id
            WHERE ins.id = ?
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$task_id]);
        $task = $stmt->fetch();
    }

    if (!$task) {
        throw new Exception("Task not found with ID: $task_id", 404);
    }

    // Build comprehensive response
    $response = [
        'success' => true,
        'data' => [
            'task_id' => $task['request_number'] ?: ($task_type === 'maintenance' ? "MR-{$task['id']}" : "IS-{$task['id']}"),
            'task_type' => $task_type,
            'location' => $task['drainage_point_name'] ?: 'Unknown Location',
            'type_detail' => $task['request_type'] ?: 'Unknown',
            'priority' => $task['priority'] ?: 'Medium',
            'status' => $task['status'] ?: 'Unknown',
            'description' => $task['description'] ?: '',
            'estimated_cost' => $task['estimated_cost'] ? (float)$task['estimated_cost'] : null,
            'actual_cost' => $task['actual_cost'] ? (float)$task['actual_cost'] : null,
            'scheduled_date' => $task['scheduled_date'],
            'completion_date' => $task['completion_date'],
            'operator_name' => trim($task['operator_name']) ?: 'Unknown Operator',
            
            'completion_data' => [
                'completed_at' => $task['completion_date'] ?: $task['updated_at'],
                'hours_worked' => $task['hours_worked'] ?: 'Not specified',
                'completion_percentage' => 100,
                'notes' => $task['work_summary'] ?: $task['completion_notes'] ?: $task['notes'] ?: 'Task completed successfully',
                'work_performed' => $task['work_performed'] ?: $task['work_summary'] ?: 'Work completed as scheduled',
                'findings' => $task['findings'] ?: 'No specific findings recorded',
                'recommendations' => $task['recommendations'] ?: 'No additional recommendations',
                'materials_used' => $task['materials_used'] ?: 'Standard materials and tools',
                'photos' => [] // Will be populated if photo functionality is implemented
            ],
            
            'metadata' => [
                'created_at' => $task['created_at'],
                'updated_at' => $task['updated_at'],
                'drainage_point_id' => $task['drainage_point_id']
            ]
        ]
    ];

    // Clean output buffer and send JSON
    ob_clean();
    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    // Clean any output buffer
    ob_clean();
    
    // Determine HTTP status code
    $code = method_exists($e, 'getCode') && $e->getCode() > 0 ? $e->getCode() : 500;
    if ($code < 100 || $code > 599) $code = 500;
    
    http_response_code($code);
    
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage(),
        'debug' => [
            'task_id' => $task_id ?? 'not set',
            'task_type' => $task_type ?? 'not set',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
        ]
    ]);
} catch (Throwable $e) {
    // Catch any other errors
    ob_clean();
    http_response_code(500);
    
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error',
        'debug' => [
            'error' => $e->getMessage()
        ]
    ]);
}

// End output buffering
ob_end_flush();
?>