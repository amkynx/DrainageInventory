<?php
// Enable error reporting for debugging but suppress HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0); // Changed to 0 to prevent HTML error output
ini_set('log_errors', 1); // Log errors instead of displaying them

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log requests for debugging
$logFile = 'maintenance_requests_log.txt';
$logData = date('Y-m-d H:i:s') . " - " . $_SERVER['REQUEST_METHOD'] . " request\n";
file_put_contents($logFile, $logData, FILE_APPEND);

// Database connection (using MySQLi like inspection file)
$host = 'localhost';
$db = 'DrainageInventory';
$user = 'root';
$pass = '';

try {
    $conn = new mysqli($host, $user, $pass, $db);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    file_put_contents($logFile, "Database connection successful\n", FILE_APPEND);
    
} catch (Exception $e) {
    file_put_contents($logFile, "Database connection failed: " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

function generateRequestNumber() {
    global $conn;
    $prefix = 'MR';  // MR for Maintenance Request
    $year = date('Y');
    $month = date('m');
    
    // Get the latest number for this month
    $sql = "SELECT request_number FROM maintenance_requests 
            WHERE request_number LIKE '{$prefix}{$year}{$month}%' 
            ORDER BY request_number DESC LIMIT 1";
    
    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $lastNum = intval(substr($row['request_number'], -4));
        $newNum = $lastNum + 1;
    } else {
        $newNum = 1;
    }
    
    // Format: MR202506001
    return sprintf("%s%s%s%04d", $prefix, $year, $month, $newNum);
}

// Handle GET request to fetch maintenance requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check if specific ID is requested
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $sql = "SELECT mr.*, dp.name as drainage_point_name, dp.latitude, dp.longitude,
                           u1.first_name as requested_by_name, u1.last_name as requested_by_lastname,
                           u2.first_name as assigned_to_name, u2.last_name as assigned_to_lastname
                    FROM maintenance_requests mr
                    LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
                    LEFT JOIN users u1 ON mr.requested_by = u1.id
                    LEFT JOIN users u2 ON mr.assigned_to = u2.id
                    WHERE mr.id = $id";
        } else {
            // Get all maintenance requests with related data
            $sql = "SELECT mr.*, dp.name as drainage_point_name, dp.latitude, dp.longitude,
                           u1.first_name as requested_by_name, u1.last_name as requested_by_lastname,
                           u2.first_name as assigned_to_name, u2.last_name as assigned_to_lastname
                    FROM maintenance_requests mr
                    LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
                    LEFT JOIN users u1 ON mr.requested_by = u1.id
                    LEFT JOIN users u2 ON mr.assigned_to = u2.id
                    ORDER BY mr.created_at DESC, mr.id DESC";
        }
        
        $result = $conn->query($sql);
        
        if ($result) {
            $requests = [];
            while ($row = $result->fetch_assoc()) {
                $requests[] = [
                    'id' => (int)$row['id'],
                    'request_number' => $row['request_number'],
                    'drainage_point_id' => $row['drainage_point_id'],
                    'drainage_point_name' => $row['drainage_point_name'],
                    'drainage_point_coordinates' => [
                        'lat' => $row['latitude'] ? (float)$row['latitude'] : null,
                        'lng' => $row['longitude'] ? (float)$row['longitude'] : null
                    ],
                    'request_type' => $row['request_type'],
                    'priority' => $row['priority'],
                    'description' => $row['description'],
                    'requested_by' => $row['requested_by'],
                    'requested_by_name' => $row['requested_by_name'] ? $row['requested_by_name'] . ' ' . $row['requested_by_lastname'] : null,
                    'assigned_to' => $row['assigned_to'],
                    'assigned_to_name' => $row['assigned_to_name'] ? $row['assigned_to_name'] . ' ' . $row['assigned_to_lastname'] : null,
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
            
            // If specific ID requested, return single object
            if (isset($_GET['id'])) {
                echo json_encode(!empty($requests) ? $requests[0] : null);
            } else {
                echo json_encode($requests);
            }
            
            file_put_contents($logFile, "Successfully fetched " . count($requests) . " maintenance requests\n", FILE_APPEND);
        } else {
            throw new Exception('Query failed: ' . $conn->error);
        }
    } catch (Exception $e) {
        file_put_contents($logFile, "GET error: " . $e->getMessage() . "\n", FILE_APPEND);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch maintenance requests: ' . $e->getMessage()]);
    }
    exit;
}

// Handle POST request to create new maintenance request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = file_get_contents('php://input');
        file_put_contents($logFile, "POST input: " . $input . "\n", FILE_APPEND);
        
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data: ' . json_last_error_msg());
        }
        
        // Validate required fields
        if (empty($data['drainage_point_id']) || empty($data['request_type']) || empty($data['description'])) {
            throw new Exception('Missing required fields: drainage_point_id, request_type, and description are required');
        }
        
        // Sanitize and prepare data
        $drainage_point_id = $conn->real_escape_string($data['drainage_point_id']);
        $request_type = $conn->real_escape_string($data['request_type']);
        $priority = $conn->real_escape_string($data['priority'] ?? 'Medium');
        $description = $conn->real_escape_string($data['description']);
        $requested_by = isset($data['requested_by']) ? (int)$data['requested_by'] : null;
        $assigned_to = isset($data['assigned_to']) ? (int)$data['assigned_to'] : null;
        $estimated_cost = isset($data['estimated_cost']) ? (float)$data['estimated_cost'] : null;
        $status = $conn->real_escape_string($data['status'] ?? 'Pending');
        $scheduled_date = isset($data['scheduled_date']) ? $conn->real_escape_string($data['scheduled_date']) : null;
        $notes = $conn->real_escape_string($data['notes'] ?? '');
        
        $request_number = generateRequestNumber();
        
        // Prepare and execute the insert query
        $sql = "INSERT INTO maintenance_requests (
            request_number, drainage_point_id, request_type, priority,
            description, requested_by, assigned_to, estimated_cost,
            status, scheduled_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            'sssssiiisss',
            $request_number,
            $drainage_point_id,
            $request_type,
            $priority,
            $description,
            $requested_by,
            $assigned_to,
            $estimated_cost,
            $status,
            $scheduled_date,
            $notes
        );
        
        if ($stmt->execute()) {
            $requestId = $conn->insert_id;
            file_put_contents($logFile, "Maintenance request created successfully with ID: " . $requestId . "\n", FILE_APPEND);
            
            echo json_encode([
                'success' => true,
                'message' => 'Maintenance request created successfully',
                'id' => $requestId,
                'request_number' => $request_number
            ]);
        } else {
            throw new Exception('Database error: ' . $stmt->error);
        }
        
    } catch (Exception $e) {
        file_put_contents($logFile, "POST error: " . $e->getMessage() . "\n", FILE_APPEND);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// Handle PUT request to update maintenance request
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = file_get_contents('php://input');
        file_put_contents($logFile, "PUT input: " . $input . "\n", FILE_APPEND);
        $data = json_decode($input, true);
        
        if (!isset($data['id'])) {
            throw new Exception('ID is required for update');
        }
        
        $id = (int)$data['id'];
        $updates = [];
        
        // Build dynamic update query based on provided fields
        if (isset($data['request_type'])) {
            $updates[] = "request_type = '" . $conn->real_escape_string($data['request_type']) . "'";
        }
        if (isset($data['priority'])) {
            $updates[] = "priority = '" . $conn->real_escape_string($data['priority']) . "'";
        }
        if (isset($data['description'])) {
            $updates[] = "description = '" . $conn->real_escape_string($data['description']) . "'";
        }
        if (isset($data['assigned_to'])) {
            $updates[] = "assigned_to = " . (int)$data['assigned_to'];
        }
        if (isset($data['estimated_cost'])) {
            $updates[] = "estimated_cost = " . (float)$data['estimated_cost'];
        }
        if (isset($data['actual_cost'])) {
            $updates[] = "actual_cost = " . (float)$data['actual_cost'];
        }
        if (isset($data['status'])) {
            $updates[] = "status = '" . $conn->real_escape_string($data['status']) . "'";
            // Set completion date if status is completed
            if ($data['status'] === 'Completed') {
                $updates[] = "completion_date = NOW()";
            }
        }
        if (isset($data['scheduled_date'])) {
            $updates[] = "scheduled_date = '" . $conn->real_escape_string($data['scheduled_date']) . "'";
        }
        if (isset($data['notes'])) {
            $updates[] = "notes = '" . $conn->real_escape_string($data['notes']) . "'";
        }
        if (isset($data['completion_notes'])) {
            $updates[] = "completion_notes = '" . $conn->real_escape_string($data['completion_notes']) . "'";
        }
        if (isset($data['work_summary'])) {
            $updates[] = "work_summary = '" . $conn->real_escape_string($data['work_summary']) . "'";
        }
        if (isset($data['hours_worked'])) {
            $updates[] = "hours_worked = " . (float)$data['hours_worked'];
        }
        if (isset($data['materials_used'])) {
            $updates[] = "materials_used = '" . $conn->real_escape_string($data['materials_used']) . "'";
        }
        if (isset($data['work_performed'])) {
            $updates[] = "work_performed = '" . $conn->real_escape_string($data['work_performed']) . "'";
        }
        if (isset($data['findings'])) {
            $updates[] = "findings = '" . $conn->real_escape_string($data['findings']) . "'";
        }
        if (isset($data['recommendations'])) {
            $updates[] = "recommendations = '" . $conn->real_escape_string($data['recommendations']) . "'";
        }
        
        if (empty($updates)) {
            throw new Exception('No valid fields provided for update');
        }
        
        // Update always includes updated_at
        $updates[] = "updated_at = NOW()";
        
        // Start transaction for completion processing
        $conn->autocommit(false);
        
        try {
            // Update the maintenance request
            $sql = "UPDATE maintenance_requests SET " . implode(', ', $updates) . " WHERE id = $id";
            file_put_contents($logFile, "Executing SQL: $sql\n", FILE_APPEND);
            
            if (!$conn->query($sql)) {
                throw new Exception('Failed to update maintenance request: ' . $conn->error);
            }
            
            $completion_id = null;
            
            // If this is a completion, insert into task_completions table
            if (isset($data['status']) && $data['status'] === 'Completed') {
                
                file_put_contents($logFile, "Processing completion for maintenance request ID $id\n", FILE_APPEND);
                
                // Get the maintenance request details for completion record
                $maintenanceQuery = "SELECT * FROM maintenance_requests WHERE id = $id";
                $maintenanceResult = $conn->query($maintenanceQuery);
                
                if (!$maintenanceResult || $maintenanceResult->num_rows === 0) {
                    throw new Exception('Maintenance request not found for completion');
                }
                
                $maintenance = $maintenanceResult->fetch_assoc();
                
                // Check if task_completions table exists, if not create it
                $tableCheckSql = "SHOW TABLES LIKE 'task_completions'";
                $tableExists = $conn->query($tableCheckSql);
                
                if ($tableExists->num_rows === 0) {
                    // Create the table if it doesn't exist
                    $createTableSql = "CREATE TABLE task_completions (
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
                        follow_up_requested TINYINT(1) DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )";
                    
                    if (!$conn->query($createTableSql)) {
                        file_put_contents($logFile, "Failed to create task_completions table: " . $conn->error . "\n", FILE_APPEND);
                    } else {
                        file_put_contents($logFile, "Created task_completions table\n", FILE_APPEND);
                    }
                }
                
                // Extract completion data with defaults
                $operator_id = $maintenance['assigned_to'] ?? 0;
                $hours_worked = isset($data['hours_worked']) ? (float)$data['hours_worked'] : 0.00;
                $work_description = $data['work_summary'] ?? $data['work_description'] ?? $maintenance['description'];
                $notes = $data['completion_notes'] ?? $data['notes'] ?? 'Maintenance completed successfully';
                $findings = $data['findings'] ?? 'Maintenance completed successfully';
                $recommendations = $data['recommendations'] ?? 'No specific recommendations';
                $materials_used = $data['materials_used'] ?? 'Standard maintenance materials';
                $actual_cost = isset($data['actual_cost']) ? (float)$data['actual_cost'] : ($maintenance['estimated_cost'] ?? 0.00);
                $follow_up_requested = isset($data['follow_up_requested']) ? (int)$data['follow_up_requested'] : 0;
                
                // Ensure operator_id is always an integer
                if ($operator_id === null || $operator_id === '') {
                    $operator_id = 0;
                } else {
                    $operator_id = (int)$operator_id;
                }
                
                // Log the data being inserted
                file_put_contents($logFile, "Completion data: operator_id=$operator_id, hours_worked=$hours_worked, actual_cost=$actual_cost, follow_up_requested=$follow_up_requested\n", FILE_APPEND);
                
                // Insert into task_completions table
                $completionSql = "INSERT INTO task_completions (
                    task_id, task_type, operator_id, completion_date, 
                    hours_worked, work_description, notes, findings, 
                    recommendations, materials_used, actual_cost, 
                    follow_up_requested
                ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)";
                
                $stmt = $conn->prepare($completionSql);
                
                if (!$stmt) {
                    throw new Exception('Failed to prepare completion statement: ' . $conn->error);
                }
                
                // Assign string literal to a variable for bind_param
                $task_type = 'maintenance';

                $bindResult = $stmt->bind_param(
                    'isiisssssdi',
                    $id,                    // task_id (int)
                    $task_type,             // task_type (string)  
                    $operator_id,           // operator_id (int)
                    $hours_worked,          // hours_worked (decimal)
                    $work_description,      // work_description (string)
                    $notes,                 // notes (string)
                    $findings,              // findings (string)
                    $recommendations,       // recommendations (string)
                    $materials_used,        // materials_used (string)
                    $actual_cost,           // actual_cost (decimal)
                    $follow_up_requested    // follow_up_requested (int)
                );
                
                if (!$bindResult) {
                    throw new Exception('Failed to bind parameters: ' . $stmt->error);
                }
                
                if (!$stmt->execute()) {
                    throw new Exception('Failed to create completion record: ' . $stmt->error);
                }
                
                $completion_id = $conn->insert_id;
                file_put_contents($logFile, "Created completion record with ID: $completion_id\n", FILE_APPEND);
                
                $stmt->close();
            }
            
            // Commit transaction
            $conn->commit();
            $conn->autocommit(true);
            
            $response = [
                'success' => true, 
                'message' => 'Maintenance request updated successfully',
                'completion_recorded' => isset($data['status']) && $data['status'] === 'Completed'
            ];
            
            if ($completion_id) {
                $response['completion_id'] = $completion_id;
            }
            
            echo json_encode($response);
            
            file_put_contents($logFile, "Successfully updated maintenance request ID $id\n", FILE_APPEND);
            
        } catch (Exception $e) {
            // Rollback transaction on error
            $conn->rollback();
            $conn->autocommit(true);
            throw $e;
        }
        
    } catch (Exception $e) {
        file_put_contents($logFile, "PUT error: " . $e->getMessage() . "\n", FILE_APPEND);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// Handle DELETE request
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $params = [];
        parse_str($_SERVER['QUERY_STRING'], $params);
        
        if (!isset($params['id'])) {
            throw new Exception('ID parameter is required');
        }
        
        $id = (int)$params['id'];
        
        $sql = "DELETE FROM maintenance_requests WHERE id = $id";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Maintenance request deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Maintenance request not found']);
            }
        } else {
            throw new Exception('Database error: ' . $conn->error);
        }
        
    } catch (Exception $e) {
        file_put_contents($logFile, "DELETE error: " . $e->getMessage() . "\n", FILE_APPEND);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed: ' . $_SERVER['REQUEST_METHOD']]);
$conn->close();
?>