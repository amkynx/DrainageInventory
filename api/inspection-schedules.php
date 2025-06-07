<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
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

// Handle GET request to fetch inspection schedules
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check if specific ID is requested
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $sql = "SELECT ins.*, dp.name as drainage_point_name, dp.latitude, dp.longitude,
                           u1.first_name as inspector_name, u1.last_name as inspector_lastname,
                           u2.first_name as created_by_name, u2.last_name as created_by_lastname
                    FROM inspection_schedules ins
                    LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
                    LEFT JOIN users u1 ON ins.inspector_id = u1.id
                    LEFT JOIN users u2 ON ins.created_by = u2.id
                    WHERE ins.id = $id";
        } else {
            // Get all inspection schedules with related data
            $sql = "SELECT ins.*, dp.name as drainage_point_name, dp.latitude, dp.longitude,
                           u1.first_name as inspector_name, u1.last_name as inspector_lastname,
                           u2.first_name as created_by_name, u2.last_name as created_by_lastname,
                           CASE 
                               WHEN ins.scheduled_date < CURDATE() AND ins.status != 'Completed' THEN 'Overdue'
                               ELSE ins.status
                           END as current_status
                    FROM inspection_schedules ins
                    LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
                    LEFT JOIN users u1 ON ins.inspector_id = u1.id
                    LEFT JOIN users u2 ON ins.created_by = u2.id
                    ORDER BY ins.scheduled_date ASC";
        }
        
        $result = $conn->query($sql);
        
        if ($result) {
            $schedules = [];
            while ($row = $result->fetch_assoc()) {
                $schedules[] = [
                    'id' => (int)$row['id'],
                    'drainage_point_id' => (int)$row['drainage_point_id'],
                    'drainage_point_name' => $row['drainage_point_name'],
                    'drainage_point_coordinates' => [
                        'lat' => $row['latitude'] ? (float)$row['latitude'] : null,
                        'lng' => $row['longitude'] ? (float)$row['longitude'] : null
                    ],
                    'inspection_type' => $row['inspection_type'],
                    'scheduled_date' => $row['scheduled_date'],
                    'scheduled_time' => $row['scheduled_time'],
                    'inspector_id' => $row['inspector_id'],
                    'inspector_name' => $row['inspector_name'] ? $row['inspector_name'] . ' ' . $row['inspector_lastname'] : null,
                    'frequency' => $row['frequency'],
                    'next_inspection_date' => $row['next_inspection_date'],
                    'status' => $row['current_status'] ?? $row['status'],
                    'priority' => $row['priority'],
                    'description' => $row['description'],
                    'inspection_checklist' => $row['inspection_checklist'] ? json_decode($row['inspection_checklist'], true) : null,
                    'findings' => $row['findings'],
                    'recommendations' => $row['recommendations'],
                    'images' => $row['images'],
                    'completion_date' => $row['completion_date'],
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
        $drainage_point_id = (int)$data['drainage_point_id'];
        $inspection_type = $conn->real_escape_string($data['inspection_type']);
        $scheduled_date = $conn->real_escape_string($data['scheduled_date']);
        $scheduled_time = isset($data['scheduled_time']) ? "'" . $conn->real_escape_string($data['scheduled_time']) . "'" : 'NULL';
        $inspector_id = isset($data['inspector_id']) ? (int)$data['inspector_id'] : 4; // Default to inspector user
        $frequency = $conn->real_escape_string($data['frequency'] ?? 'One-time');
        $priority = $conn->real_escape_string($data['priority'] ?? 'Medium');
        $description = $conn->real_escape_string($data['description'] ?? '');
        $created_by = isset($data['created_by']) ? (int)$data['created_by'] : 1; // Default to admin user
        
        // Calculate next inspection date if recurring
        $next_inspection_date = 'NULL';
        if ($frequency !== 'One-time') {
            $next_date = calculateNextInspectionDate($scheduled_date, $frequency);
            $next_inspection_date = $next_date ? "'$next_date'" : 'NULL';
        }
        
        // Prepare inspection checklist if provided
        $inspection_checklist = 'NULL';
        if (isset($data['inspection_checklist']) && is_array($data['inspection_checklist'])) {
            $inspection_checklist = "'" . $conn->real_escape_string(json_encode($data['inspection_checklist'])) . "'";
        }
        
        $sql = "INSERT INTO inspection_schedules (
                    drainage_point_id, inspection_type, scheduled_date, scheduled_time,
                    inspector_id, frequency, next_inspection_date, priority,
                    description, inspection_checklist, created_by
                ) VALUES (
                    $drainage_point_id, '$inspection_type', '$scheduled_date', $scheduled_time,
                    $inspector_id, '$frequency', $next_inspection_date, '$priority',
                    '$description', $inspection_checklist, $created_by
                )";
        
        file_put_contents($logFile, "SQL Query: " . $sql . "\n", FILE_APPEND);
        
        if ($conn->query($sql)) {
            $scheduleId = $conn->insert_id;
            file_put_contents($logFile, "Inspection schedule created successfully with ID: " . $scheduleId . "\n", FILE_APPEND);
            
            echo json_encode([
                'success' => true,
                'message' => 'Inspection scheduled successfully',
                'id' => $scheduleId
            ]);
        } else {
            throw new Exception('Database error: ' . $conn->error);
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
        if (isset($data['inspector_id'])) {
            $updates[] = "inspector_id = " . (int)$data['inspector_id'];
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
        if (isset($data['inspection_checklist']) && is_array($data['inspection_checklist'])) {
            $updates[] = "inspection_checklist = '" . $conn->real_escape_string(json_encode($data['inspection_checklist'])) . "'";
        }
        
        if (empty($updates)) {
            throw new Exception('No valid fields provided for update');
        }
        
        $sql = "UPDATE inspection_schedules SET " . implode(', ', $updates) . " WHERE id = $id";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Inspection schedule updated successfully']);
            } else {
                echo json_encode(['success' => true, 'message' => 'No changes made to inspection schedule']);
            }
        } else {
            throw new Exception('Database error: ' . $conn->error);
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