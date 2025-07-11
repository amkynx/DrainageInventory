<?php
// Enable error reporting for debugging but suppress HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0); // FIXED: Changed to 0 to prevent HTML error output
ini_set('log_errors', 1); // Log errors instead of displaying them
ini_set('display_errors', 1);

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
$logFile = 'inspection_schedules_log.txt';
$logData = date('Y-m-d H:i:s') . " - " . $_SERVER['REQUEST_METHOD'] . " request\n";
file_put_contents($logFile, $logData, FILE_APPEND);

// Database connection
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

function generateScheduleNumber() {
    global $conn;
    $prefix = 'IS';  // IS for Inspection Schedule
    $year = date('Y');
    $month = date('m');
    
    // Get the latest number for this month
    $sql = "SELECT schedule_number FROM inspection_schedules 
            WHERE schedule_number LIKE '{$prefix}{$year}{$month}%' 
            ORDER BY schedule_number DESC LIMIT 1";
    
    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $lastNum = intval(substr($row['schedule_number'], -4));
        $newNum = $lastNum + 1;
    } else {
        $newNum = 1;
    }
    
    // Format: IS202506001
    return sprintf("%s%s%s%04d", $prefix, $year, $month, $newNum);
}


// Handle GET request to fetch inspection schedules
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check if specific ID is requested
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $sql = "SELECT ins.*, dp.name as drainage_point_name, dp.latitude, dp.longitude,
                           u1.first_name as operator_name, u1.last_name as operator_lastname,
                           CASE 
                               WHEN ins.scheduled_date < CURDATE() AND ins.status != 'Completed' THEN 'Overdue'
                               ELSE ins.status
                           END as current_status
                    FROM inspection_schedules ins
                    LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
                    LEFT JOIN users u1 ON ins.operator_id = u1.id
                    WHERE ins.id = $id";
        } else {
            // Get all inspection schedules with related data
            $sql = "SELECT ins.*, dp.name as drainage_point_name, dp.latitude, dp.longitude,
                           u1.first_name as operator_name, u1.last_name as operator_lastname,
                           u2.first_name as created_by_name, u2.last_name as created_by_lastname,
                           CASE 
                               WHEN ins.scheduled_date < CURDATE() AND ins.status != 'Completed' THEN 'Overdue'
                               ELSE ins.status
                           END as current_status
                    FROM inspection_schedules ins
                    LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
                    LEFT JOIN users u1 ON ins.operator_id = u1.id
                    LEFT JOIN users u2 ON ins.created_by = u2.id
                    ORDER BY ins.created_at DESC, ins.id DESC";
        }
        
        $result = $conn->query($sql);
        
        if ($result) {
            $schedules = [];
            while ($row = $result->fetch_assoc()) {
                $schedules[] = [
                    'id' => (int)$row['id'],
                    'drainage_point_id' => $row['drainage_point_id'],
                    'drainage_point_name' => $row['drainage_point_name'],
                    'drainage_point_coordinates' => [
                        'lat' => $row['latitude'] ? (float)$row['latitude'] : null,
                        'lng' => $row['longitude'] ? (float)$row['longitude'] : null
                    ],
                    'inspection_type' => $row['inspection_type'],
                    'scheduled_date' => $row['scheduled_date'],
                    'scheduled_time' => $row['scheduled_time'],
                    'operator_id' => $row['operator_id'],
                    'operator_name' => $row['operator_name'] ? $row['operator_name'] . ' ' . $row['operator_lastname'] : null,
                    'frequency' => $row['frequency'],
                    'next_inspection_date' => $row['next_inspection_date'],
                    'status' => $row['current_status'] ?? $row['status'],
                    'priority' => $row['priority'],
                    'description' => $row['description'],
                    'inspection_checklist' => $row['inspection_checklist'] ? json_decode($row['inspection_checklist'], true) : null,
                    'findings' => $row['findings'] ?? null,
                    'recommendations' => $row['recommendations'] ?? null,
                    'images' => $row['images'] ?? null,
                    'completion_date' => $row['completion_date'] ?? null,
                    'created_by' => $row['created_by'],
                    'created_by_name' => $row['created_by_name'] ? $row['created_by_name'] . ' ' . $row['created_by_lastname'] : null,
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at']
                ];
            }
            
            // If specific ID requested, return single object
            if (isset($_GET['id'])) {
                echo json_encode(!empty($schedules) ? $schedules[0] : null);
            } else {
                echo json_encode($schedules);
            }
            
            file_put_contents($logFile, "Successfully fetched " . count($schedules) . " inspection schedules\n", FILE_APPEND);
        } else {
            throw new Exception('Query failed: ' . $conn->error);
        }
    } catch (Exception $e) {
        file_put_contents($logFile, "GET error: " . $e->getMessage() . "\n", FILE_APPEND);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch inspection schedules: ' . $e->getMessage()]);
    }
    exit;
}

// Handle POST request to create new inspection schedule
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = file_get_contents('php://input');
        file_put_contents($logFile, "POST input: " . $input . "\n", FILE_APPEND);
        
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data: ' . json_last_error_msg());
        }
        
        // Validate required fields
        if (empty($data['drainage_point_id']) || empty($data['inspection_type']) || empty($data['scheduled_date'])) {
            throw new Exception('Missing required fields: drainage_point_id, inspection_type, and scheduled_date are required');
        }
        
        // Sanitize and prepare data
        $drainage_point_id = $conn->real_escape_string($data['drainage_point_id']);
        $inspection_type = $conn->real_escape_string($data['inspection_type']);
        $priority = $conn->real_escape_string($data['priority'] ?? 'Medium');
        $frequency = $conn->real_escape_string($data['frequency'] ?? 'One-time');
        $operator_id = isset($data['operator_id']) ? (int)$data['operator_id'] : null;
        $description = $conn->real_escape_string($data['description'] ?? '');
        $scheduled_date = $conn->real_escape_string($data['scheduled_date']);
        $scheduled_time = isset($data['scheduled_time']) ? $conn->real_escape_string($data['scheduled_time']) : null;
        
        $schedule_number = generateScheduleNumber();
        
        // Prepare and execute the insert query
        $sql = "INSERT INTO inspection_schedules (
            schedule_number, drainage_point_id, inspection_type, priority,
            status, scheduled_date, scheduled_time, frequency, description,
            operator_id 
        ) VALUES (?, ?, ?, ?, 'Scheduled', ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            'ssssssssi',
            $schedule_number,
            $drainage_point_id,
            $inspection_type,
            $priority,
            $scheduled_date,
            $scheduled_time,
            $frequency,
            $description,
            $operator_id
        );
        
        if ($stmt->execute()) {
            $scheduleId = $conn->insert_id;
            file_put_contents($logFile, "Inspection schedule created successfully with ID: " . $scheduleId . "\n", FILE_APPEND);
            
            echo json_encode([
                'success' => true,
                'message' => 'Inspection scheduled successfully',
                'id' => $scheduleId
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

// Handle PUT request to update inspection schedule
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
        if (isset($data['inspection_type'])) {
            $updates[] = "inspection_type = '" . $conn->real_escape_string($data['inspection_type']) . "'";
        }
        if (isset($data['scheduled_date'])) {
            $updates[] = "scheduled_date = '" . $conn->real_escape_string($data['scheduled_date']) . "'";
        }
        if (isset($data['scheduled_time'])) {
            $updates[] = "scheduled_time = '" . $conn->real_escape_string($data['scheduled_time']) . "'";
        }
        if (isset($data['operator_id'])) {
            $updates[] = "operator_id = " . (int)$data['operator_id'];
        }
        if (isset($data['frequency'])) {
            $updates[] = "frequency = '" . $conn->real_escape_string($data['frequency']) . "'";
        }
        if (isset($data['priority'])) {
            $updates[] = "priority = '" . $conn->real_escape_string($data['priority']) . "'";
        }
        if (isset($data['description'])) {
            $updates[] = "description = '" . $conn->real_escape_string($data['description']) . "'";
        }
        if (isset($data['status'])) {
            $updates[] = "status = '" . $conn->real_escape_string($data['status']) . "'";
            // Set completion date if status is completed
            if ($data['status'] === 'Completed') {
                $updates[] = "completion_date = NOW()";
            }
        }
        if (isset($data['findings'])) {
            $updates[] = "findings = '" . $conn->real_escape_string($data['findings']) . "'";
        }
        if (isset($data['recommendations'])) {
            $updates[] = "recommendations = '" . $conn->real_escape_string($data['recommendations']) . "'";
        }
        if (isset($data['completion_notes'])) {
            $updates[] = "completion_notes = '" . $conn->real_escape_string($data['completion_notes']) . "'";
        }
        if (isset($data['hours_worked'])) {
            $updates[] = "hours_worked = " . (float)$data['hours_worked'];
        }
        if (isset($data['inspection_checklist']) && is_array($data['inspection_checklist'])) {
            $updates[] = "inspection_checklist = '" . $conn->real_escape_string(json_encode($data['inspection_checklist'])) . "'";
        }
        
        if (empty($updates)) {
            throw new Exception('No valid fields provided for update');
        }
        
        // Update always includes updated_at
        $updates[] = "updated_at = NOW()";
        
        // Start transaction for completion processing
        $conn->autocommit(false);
        
        try {
            // Update the inspection schedule
            $sql = "UPDATE inspection_schedules SET " . implode(', ', $updates) . " WHERE id = $id";
            file_put_contents($logFile, "Executing SQL: $sql\n", FILE_APPEND);
            
            if (!$conn->query($sql)) {
                throw new Exception('Failed to update inspection schedule: ' . $conn->error);
            }
            
            $completion_id = null;
            
            // FIXED: If this is a completion, insert into task_completions table
            if (isset($data['status']) && $data['status'] === 'Completed') {
                
                file_put_contents($logFile, "Processing completion for inspection ID $id\n", FILE_APPEND);
                
                // Get the inspection details for completion record
                $inspectionQuery = "SELECT * FROM inspection_schedules WHERE id = $id";
                $inspectionResult = $conn->query($inspectionQuery);
                
                if (!$inspectionResult || $inspectionResult->num_rows === 0) {
                    throw new Exception('Inspection not found for completion');
                }
                
                $inspection = $inspectionResult->fetch_assoc();
                
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
                $operator_id = $inspection['operator_id'] ?? 0;
                $hours_worked = isset($data['hours_worked']) ? (float)$data['hours_worked'] : 0.00;
                $work_description = $data['work_description'] ?? $data['findings'] ?? 'Inspection completed';
                $notes = $data['completion_notes'] ?? $data['notes'] ?? 'Inspection completed successfully';
                $findings = $data['findings'] ?? 'Inspection completed successfully';
                $recommendations = $data['recommendations'] ?? 'No specific recommendations';
                $materials_used = $data['materials_used'] ?? 'Standard inspection tools';
                $actual_cost = isset($data['actual_cost']) ? (float)$data['actual_cost'] : 0.00;
                $follow_up_requested = isset($data['follow_up_requested']) ? (int)$data['follow_up_requested'] : 0;
                
                // FIXED: Ensure operator_id is always an integer (use 0 if null)
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
                $task_type = 'inspection';

                // FIXED: Correct bind_param type string - 'isiisssssdi' (11 parameters)
                // i = integer, s = string, d = double/decimal
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
                'message' => 'Inspection schedule updated successfully',
                'completion_recorded' => isset($data['status']) && $data['status'] === 'Completed'
            ];
            
            if ($completion_id) {
                $response['completion_id'] = $completion_id;
            }
            
            echo json_encode($response);
            
            file_put_contents($logFile, "Successfully updated inspection schedule ID $id\n", FILE_APPEND);
            
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
        
        $sql = "DELETE FROM inspection_schedules WHERE id = $id";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Inspection schedule deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Inspection schedule not found']);
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

// Function to calculate next inspection date based on frequency
function calculateNextInspectionDate($currentDate, $frequency) {
    $date = new DateTime($currentDate);
    
    switch ($frequency) {
        case 'Weekly':
            $date->add(new DateInterval('P7D'));
            break;
        case 'Monthly':
            $date->add(new DateInterval('P1M'));
            break;
        case 'Quarterly':
            $date->add(new DateInterval('P3M'));
            break;
        case 'Yearly':
            $date->add(new DateInterval('P1Y'));
            break;
        default:
            return null;
    }
    
    return $date->format('Y-m-d');
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed: ' . $_SERVER['REQUEST_METHOD']]);
$conn->close();
?>