<?php
/**
 * DrainTrack - Maintenance Requests API (FIXED VERSION)
 * Handles CRUD operations for maintenance requests
 * 
 * @author DrainTrack Systems
 * @version 2.0 - CLEAN JSON API
 */

// DISABLE HTML ERROR OUTPUT - Critical for JSON APIs
error_reporting(0);
ini_set('display_errors', 0);

// Set JSON headers FIRST
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

    // Database configuration - try multiple common configurations
    $possible_configs = [
        [
            'host' => 'localhost',
            'dbname' => 'DrainageInventory',
            'username' => 'root',
            'password' => ''
        ],
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
            'dbname' => 'DrainageInventory',
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
        throw new Exception('Database connection failed: ' . $connection_error);
    }

    /**
     * Generate unique request number
     */
    function generateRequestNumber($pdo) {
        $prefix = 'MR';  // MR for Maintenance Request
        $year = date('Y');
        $month = date('m');
        
        // Get the latest number for this month
        $sql = "SELECT request_number FROM maintenance_requests 
                WHERE request_number LIKE :pattern 
                ORDER BY request_number DESC LIMIT 1";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':pattern' => "{$prefix}{$year}{$month}%"]);
        $result = $stmt->fetch();
        
        if ($result) {
            $lastNum = intval(substr($result['request_number'], -4));
            $newNum = $lastNum + 1;
        } else {
            $newNum = 1;
        }
        
        // Format: MR202506001
        return sprintf("%s%s%s%04d", $prefix, $year, $month, $newNum);
    }

    /**
     * Get all maintenance requests
     */
    function getMaintenanceRequests($pdo, $id = null, $drainage_point_id = null) {
        try {
            $sql = "SELECT mr.*, 
                           dp.name as drainage_point_name, 
                           dp.latitude, 
                           dp.longitude,
                           CONCAT(COALESCE(u1.first_name, ''), ' ', COALESCE(u1.last_name, '')) as requested_by_name,
                           CONCAT(COALESCE(u2.first_name, ''), ' ', COALESCE(u2.last_name, '')) as assigned_to_name
                    FROM maintenance_requests mr
                    LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
                    LEFT JOIN users u1 ON mr.requested_by = u1.id
                    LEFT JOIN users u2 ON mr.assigned_to = u2.id";
            
            $params = [];
            
            if ($id) {
                $sql .= " WHERE mr.id = :id";
                $params[':id'] = $id;
            } elseif ($drainage_point_id) {
                $sql .= " WHERE mr.drainage_point_id = :drainage_point_id";
                $params[':drainage_point_id'] = $drainage_point_id;
            }
            
            $sql .= " ORDER BY mr.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll();
            
            $requests = [];
            foreach ($results as $row) {
                $requests[] = [
                    'id' => (int)$row['id'],
                    'request_number' => $row['request_number'],
                    'drainage_point_id' => (int)$row['drainage_point_id'],
                    'drainage_point_name' => $row['drainage_point_name'],
                    'drainage_point_coordinates' => [
                        'lat' => $row['latitude'] ? (float)$row['latitude'] : null,
                        'lng' => $row['longitude'] ? (float)$row['longitude'] : null
                    ],
                    'request_type' => $row['request_type'],
                    'priority' => $row['priority'],
                    'description' => $row['description'],
                    'requested_by' => $row['requested_by'] ? (int)$row['requested_by'] : null,
                    'requested_by_name' => trim($row['requested_by_name']) ?: null,
                    'assigned_to' => $row['assigned_to'] ? (int)$row['assigned_to'] : null,
                    'assigned_to_name' => trim($row['assigned_to_name']) ?: null,
                    'estimated_cost' => $row['estimated_cost'] ? (float)$row['estimated_cost'] : null,
                    'actual_cost' => $row['actual_cost'] ? (float)$row['actual_cost'] : null,
                    'status' => $row['status'],
                    'scheduled_date' => $row['scheduled_date'],
                    'completion_date' => $row['completion_date'],
                    'notes' => $row['notes'],
                    'completion_notes' => $row['completion_notes'],
                    'work_summary' => $row['work_summary'],
                    'hours_worked' => $row['hours_worked'] ? (float)$row['hours_worked'] : null,
                    'materials_used' => $row['materials_used'],
                    'work_performed' => $row['work_performed'],
                    'findings' => $row['findings'],
                    'recommendations' => $row['recommendations'],
                    'images' => $row['images'],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at']
                ];
            }
            
            return $requests;
            
        } catch (Exception $e) {
            throw new Exception('Failed to fetch maintenance requests: ' . $e->getMessage());
        }
    }

    /**
     * Create new maintenance request
     */
    function createMaintenanceRequest($pdo, $data) {
        try {
            // Validate required fields
            if (empty($data['drainage_point_id']) || empty($data['request_type']) || empty($data['description'])) {
                throw new Exception('Missing required fields: drainage_point_id, request_type, and description are required');
            }
            
            $request_number = generateRequestNumber($pdo);
            
            $sql = "INSERT INTO maintenance_requests (
                        request_number, drainage_point_id, request_type, priority, 
                        description, requested_by, assigned_to, estimated_cost, 
                        status, scheduled_date, notes, created_at, updated_at
                    ) VALUES (
                        :request_number, :drainage_point_id, :request_type, :priority,
                        :description, :requested_by, :assigned_to, :estimated_cost,
                        :status, :scheduled_date, :notes, NOW(), NOW()
                    )";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':request_number' => $request_number,
                ':drainage_point_id' => $data['drainage_point_id'],
                ':request_type' => $data['request_type'],
                ':priority' => $data['priority'] ?? 'Medium',
                ':description' => $data['description'],
                ':requested_by' => $data['requested_by'] ?? null,
                ':assigned_to' => $data['assigned_to'] ?? null,
                ':estimated_cost' => $data['estimated_cost'] ?? null,
                ':status' => $data['status'] ?? 'Pending',
                ':scheduled_date' => $data['scheduled_date'] ?? null,
                ':notes' => $data['notes'] ?? null
            ]);
            
            $requestId = $pdo->lastInsertId();
            
            return [
                'success' => true,
                'message' => 'Maintenance request created successfully',
                'id' => (int)$requestId,
                'request_number' => $request_number
            ];
            
        } catch (Exception $e) {
            throw new Exception('Failed to create maintenance request: ' . $e->getMessage());
        }
    }

    /**
     * Update maintenance request
     */
    function updateMaintenanceRequest($pdo, $data) {
        try {
            if (!isset($data['id'])) {
                throw new Exception('ID is required for update');
            }
            
            $id = (int)$data['id'];
            $updates = [];
            $params = [':id' => $id];
            
            // Build dynamic update query
            $updateFields = [
                'drainage_point_id', 'request_type', 'priority', 'description',
                'assigned_to', 'estimated_cost', 'actual_cost', 'status', 
                'scheduled_date', 'notes', 'completion_notes', 'work_summary',
                'hours_worked', 'materials_used', 'work_performed', 
                'findings', 'recommendations'
            ];
            
            foreach ($updateFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "{$field} = :{$field}";
                    $params[":{$field}"] = $data[$field];
                }
            }
            
            // Set completion date if status is completed
            if (isset($data['status']) && $data['status'] === 'Completed') {
                $updates[] = "completion_date = NOW()";
            }
            
            if (empty($updates)) {
                throw new Exception('No valid fields provided for update');
            }
            
            // Always update the updated_at timestamp
            $updates[] = "updated_at = NOW()";
            
            $sql = "UPDATE maintenance_requests SET " . implode(', ', $updates) . " WHERE id = :id";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception('Maintenance request not found or no changes made');
            }
            
            // Handle completion logic
            $completion_recorded = false;
            if (isset($data['status']) && $data['status'] === 'Completed') {
                $completion_recorded = createCompletionRecord($pdo, $id, $data);
            }
            
            return [
                'success' => true,
                'message' => 'Maintenance request updated successfully',
                'completion_recorded' => $completion_recorded
            ];
            
        } catch (Exception $e) {
            throw new Exception('Failed to update maintenance request: ' . $e->getMessage());
        }
    }

    /**
     * Create completion record for completed maintenance
     */
    function createCompletionRecord($pdo, $task_id, $data) {
        try {
            // Create task_completions table if it doesn't exist
            $createTableSql = "CREATE TABLE IF NOT EXISTS task_completions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT NOT NULL,
                task_type VARCHAR(50) NOT NULL,
                operator_id INT,
                completion_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                hours_worked DECIMAL(5,2) DEFAULT 0.00,
                work_description TEXT,
                notes TEXT,
                findings TEXT,
                recommendations TEXT,
                materials_used TEXT,
                actual_cost DECIMAL(10,2) DEFAULT 0.00,
                completion_percentage INT DEFAULT 100,
                follow_up_requested TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_task (task_id, task_type)
            )";
            
            $pdo->exec($createTableSql);
            
            // Get maintenance request details
            $sql = "SELECT * FROM maintenance_requests WHERE id = :task_id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':task_id' => $task_id]);
            $maintenance = $stmt->fetch();
            
            if (!$maintenance) {
                throw new Exception('Maintenance request not found');
            }
            
            // Insert completion record
            $completionSql = "INSERT INTO task_completions (
                task_id, task_type, operator_id, completion_date,
                hours_worked, work_description, notes, findings,
                recommendations, materials_used, actual_cost,
                completion_percentage, follow_up_requested
            ) VALUES (
                :task_id, :task_type, :operator_id, NOW(),
                :hours_worked, :work_description, :notes, :findings,
                :recommendations, :materials_used, :actual_cost,
                :completion_percentage, :follow_up_requested
            )";
            
            $stmt = $pdo->prepare($completionSql);
            $stmt->execute([
                ':task_id' => $task_id,
                ':task_type' => 'maintenance',
                ':operator_id' => $maintenance['assigned_to'] ?? null,
                ':hours_worked' => $data['hours_worked'] ?? 0.00,
                ':work_description' => $data['work_summary'] ?? $data['work_description'] ?? $maintenance['description'],
                ':notes' => $data['completion_notes'] ?? $data['notes'] ?? 'Maintenance completed successfully',
                ':findings' => $data['findings'] ?? 'Maintenance completed as scheduled',
                ':recommendations' => $data['recommendations'] ?? 'No additional recommendations',
                ':materials_used' => $data['materials_used'] ?? 'Standard maintenance materials',
                ':actual_cost' => $data['actual_cost'] ?? $maintenance['estimated_cost'] ?? 0.00,
                ':completion_percentage' => $data['completion_percentage'] ?? 100,
                ':follow_up_requested' => $data['follow_up_requested'] ?? 0
            ]);
            
            return true;
            
        } catch (Exception $e) {
            // Don't fail the main update if completion record fails
            error_log("Failed to create completion record: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete maintenance request
     */
    function deleteMaintenanceRequest($pdo, $id) {
        try {
            $sql = "DELETE FROM maintenance_requests WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception('Maintenance request not found');
            }
            
            return [
                'success' => true,
                'message' => 'Maintenance request deleted successfully'
            ];
            
        } catch (Exception $e) {
            throw new Exception('Failed to delete maintenance request: ' . $e->getMessage());
        }
    }

    // Handle different HTTP methods
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $id = $_GET['id'] ?? null;
            $drainage_point_id = $_GET['drainage_point_id'] ?? null;
            
            $requests = getMaintenanceRequests($pdo, $id, $drainage_point_id);
            
            // Clean output buffer and send JSON
            ob_clean();
            
            if ($id) {
                echo json_encode(!empty($requests) ? $requests[0] : null);
            } else {
                echo json_encode($requests);
            }
            break;
            
        case 'POST':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON data: ' . json_last_error_msg());
            }
            
            $result = createMaintenanceRequest($pdo, $data);
            
            // Clean output buffer and send JSON
            ob_clean();
            echo json_encode($result);
            break;
            
        case 'PUT':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON data: ' . json_last_error_msg());
            }
            
            $result = updateMaintenanceRequest($pdo, $data);
            
            // Clean output buffer and send JSON
            ob_clean();
            echo json_encode($result);
            break;
            
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            
            if (!$id) {
                throw new Exception('ID parameter is required');
            }
            
            $result = deleteMaintenanceRequest($pdo, (int)$id);
            
            // Clean output buffer and send JSON
            ob_clean();
            echo json_encode($result);
            break;
            
        default:
            throw new Exception('Method not allowed: ' . $_SERVER['REQUEST_METHOD']);
    }

} catch (Exception $e) {
    // Clean any output buffer
    ob_clean();
    
    // Log error for debugging
    error_log("Maintenance Requests API Error: " . $e->getMessage());
    
    // Return JSON error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);
} catch (Throwable $e) {
    // Catch any other errors
    ob_clean();
    
    error_log("Maintenance Requests API Fatal Error: " . $e->getMessage());
    
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