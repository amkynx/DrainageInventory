<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers first
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log all requests for debugging
$logFile = 'flood_reports_log.txt';
$logData = date('Y-m-d H:i:s') . " - " . $_SERVER['REQUEST_METHOD'] . " request\n";
file_put_contents($logFile, $logData, FILE_APPEND);

// Database connection
$host = 'localhost';
$db = 'DrainageInventory';
$user = 'root';
$pass = ''; // Replace with your MySQL password

try {
    $conn = new mysqli($host, $user, $pass, $db);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // Set charset
    $conn->set_charset("utf8mb4");
    
    file_put_contents($logFile, "Database connection successful\n", FILE_APPEND);
    
} catch (Exception $e) {
    file_put_contents($logFile, "Database connection failed: " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Handle GET request to fetch flood reports
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $sql = "SELECT 
                    id,
                    location,
                    latitude,
                    longitude,
                    severity,
                    water_depth,
                    description,
                    contact,
                    images,
                    timestamp,
                    COALESCE(status, 'pending') as status
                FROM flood_reports 
                ORDER BY timestamp DESC";
        
        $result = $conn->query($sql);
        
        if ($result) {
            $reports = [];
            while ($row = $result->fetch_assoc()) {
                // Calculate urgency based on severity and water depth
                $urgency = calculateUrgency($row['severity'], (float)$row['water_depth']);
                
                $reports[] = [
                    'id' => (int)$row['id'],
                    'location' => $row['location'],
                    'latitude' => $row['latitude'] ? (float)$row['latitude'] : null,
                    'longitude' => $row['longitude'] ? (float)$row['longitude'] : null,
                    'severity' => $row['severity'],
                    'water_depth' => (float)$row['water_depth'],
                    'description' => $row['description'],
                    'contact' => $row['contact'],
                    'images' => $row['images'],
                    'timestamp' => $row['timestamp'],
                    'status' => $row['status'],
                    'urgency' => $urgency
                ];
            }
            
            file_put_contents($logFile, "Successfully fetched " . count($reports) . " reports\n", FILE_APPEND);
            echo json_encode($reports);
        } else {
            throw new Exception('Query failed: ' . $conn->error);
        }
    } catch (Exception $e) {
        file_put_contents($logFile, "GET error: " . $e->getMessage() . "\n", FILE_APPEND);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch reports: ' . $e->getMessage()]);
    }
    exit;
}

// Handle POST request to create new flood report
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get the input data
        $input = file_get_contents('php://input');
        file_put_contents($logFile, "POST input: " . $input . "\n", FILE_APPEND);
        
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data: ' . json_last_error_msg());
        }
        
        // Validate required fields
        if (empty($data['location']) || empty($data['severity']) || empty($data['description'])) {
            throw new Exception('Missing required fields: location, severity, and description are required');
        }
        
        // Sanitize and prepare data
        $location = $conn->real_escape_string($data['location']);
        $latitude = null;
        $longitude = null;
        
        // Handle coordinates
        if (isset($data['coordinates']) && is_array($data['coordinates']) && count($data['coordinates']) >= 2) {
            $latitude = (float)$data['coordinates'][0];
            $longitude = (float)$data['coordinates'][1];
        }
        
        $severity = $conn->real_escape_string($data['severity']);
        $water_depth = isset($data['water_depth']) ? (float)$data['water_depth'] : 0;
        $description = $conn->real_escape_string($data['description']);
        $contact = $conn->real_escape_string($data['contact'] ?? '');
        $images = $conn->real_escape_string($data['images'] ?? '');
        $status = $conn->real_escape_string($data['status'] ?? 'pending');
        
        // Check if status column exists, if not, exclude it from the query
        $statusColumnExists = false;
        $checkResult = $conn->query("SHOW COLUMNS FROM flood_reports LIKE 'status'");
        if ($checkResult && $checkResult->num_rows > 0) {
            $statusColumnExists = true;
        }
        
        // Build the SQL query
        if ($statusColumnExists) {
            $sql = "INSERT INTO flood_reports (
                        location, 
                        latitude, 
                        longitude, 
                        severity, 
                        water_depth, 
                        description, 
                        contact, 
                        images, 
                        status,
                        timestamp
                    ) VALUES (
                        '$location', 
                        " . ($latitude !== null ? $latitude : "NULL") . ", 
                        " . ($longitude !== null ? $longitude : "NULL") . ", 
                        '$severity', 
                        $water_depth, 
                        '$description', 
                        '$contact', 
                        '$images',
                        '$status',
                        NOW()
                    )";
        } else {
            $sql = "INSERT INTO flood_reports (
                        location, 
                        latitude, 
                        longitude, 
                        severity, 
                        water_depth, 
                        description, 
                        contact, 
                        images,
                        timestamp
                    ) VALUES (
                        '$location', 
                        " . ($latitude !== null ? $latitude : "NULL") . ", 
                        " . ($longitude !== null ? $longitude : "NULL") . ", 
                        '$severity', 
                        $water_depth, 
                        '$description', 
                        '$contact', 
                        '$images',
                        NOW()
                    )";
        }
        
        file_put_contents($logFile, "SQL Query: " . $sql . "\n", FILE_APPEND);
        
        if ($conn->query($sql)) {
            $reportId = $conn->insert_id;
            file_put_contents($logFile, "Report created successfully with ID: " . $reportId . "\n", FILE_APPEND);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Flood report submitted successfully',
                'id' => $reportId
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

// Handle PUT request to update flood report status
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!isset($data['id']) || !isset($data['status'])) {
            throw new Exception('ID and status are required');
        }
        
        $id = (int)$data['id'];
        $status = $conn->real_escape_string($data['status']);
        
        // Check if status column exists
        $checkResult = $conn->query("SHOW COLUMNS FROM flood_reports LIKE 'status'");
        if (!$checkResult || $checkResult->num_rows === 0) {
            throw new Exception('Status updates not supported - please add status column to database');
        }
        
        $sql = "UPDATE flood_reports SET status = '$status' WHERE id = $id";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Report status updated successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Report not found']);
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

// Function to calculate urgency based on severity and water depth
function calculateUrgency($severity, $waterDepth) {
    if ($severity === 'Extreme' || $waterDepth > 30) {
        return 'critical';
    } elseif ($severity === 'Severe' || $waterDepth > 20) {
        return 'high';
    } elseif ($severity === 'Moderate' || $waterDepth > 10) {
        return 'medium';
    } else {
        return 'low';
    }
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed: ' . $_SERVER['REQUEST_METHOD']]);
$conn->close();
?>