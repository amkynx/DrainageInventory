<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log the request for debugging
$requestMethod = $_SERVER['REQUEST_METHOD'];
$logFile = 'api_log.txt';
file_put_contents($logFile, date('Y-m-d H:i:s') . " - {$requestMethod} request\n", FILE_APPEND);

// Database connection
$host = 'localhost';
$db = 'DrainageInventory';
$user = 'root';
$pass = ''; // Replace with your MySQL password

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// For debugging PUT requests
if ($requestMethod === 'PUT') {
    $input = file_get_contents('php://input');
    file_put_contents($logFile, "PUT input: " . $input . "\n", FILE_APPEND);
}

// Handle GET request to fetch data
if ($requestMethod === 'GET') {
    // Check if a specific ID is requested
    if (isset($_GET['id'])) {
        $id = $conn->real_escape_string($_GET['id']);
        $sql = "SELECT id, name, type, status, depth, invert_level, reduced_level, latitude, longitude, description, images, last_updated FROM drainage_points WHERE id = '$id'";
    }
    // Check if a search term is provided
    else if (isset($_GET['search'])) {
        $search = $conn->real_escape_string($_GET['search']);
        $sql = "SELECT id, name, type, status, depth, invert_level, reduced_level, latitude, longitude, description, images, last_updated 
                FROM drainage_points 
                WHERE name LIKE '%$search%' OR id LIKE '%$search%'";
    }
    // Otherwise, get all points
    else {
        $sql = "SELECT id, name, type, status, depth, invert_level, reduced_level, latitude, longitude, description, images, last_updated FROM drainage_points";
    }

    $result = $conn->query($sql);

    if ($result) {
        $data = [];
        while ($row = $result->fetch_assoc()) {
            // Parse images field
            $images = null;
            if ($row['images']) {
                // Try to decode JSON, fallback to original string if it fails
                $decoded = json_decode($row['images'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $images = $decoded;
                } else {
                    // Handle legacy format (space-separated URLs)
                    $images = $row['images'];
                }
            }
            
            $data[] = [
                'id' => $row['id'], // Keep as string to support alphanumeric IDs
                'name' => $row['name'],
                'type' => $row['type'],
                'status' => $row['status'],
                'depth' => (float)$row['depth'],
                'invert_level' => $row['invert_level'],
                'reduced_level' => $row['reduced_level'],
                'coordinates' => [(float)$row['latitude'], (float)$row['longitude']],
                'description' => $row['description'],
                'images' => $images,
                'last_updated' => $row['last_updated'],
            ];
        }
        // If we're looking for a specific ID, return just that record
        if (isset($_GET['id'])) {
            echo json_encode(!empty($data) ? $data[0] : null);
        } else {
            echo json_encode($data);
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch data: ' . $conn->error]);
    }
    exit;
}

// Handle POST request to create new data
if ($requestMethod === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    file_put_contents($logFile, "POST data: " . json_encode($data) . "\n", FILE_APPEND);

    // Validate data
    if (!isset($data['id'], $data['name'], $data['type'], $data['status'], $data['coordinates'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid data: Required fields missing (id, name, type, status, coordinates)']);
        exit;
    }

    // Validate ID format (alphanumeric only)
    $id = trim(strtoupper($data['id']));
    if (!preg_match('/^[A-Z0-9]{2,20}$/', $id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid ID format. Use 2-20 alphanumeric characters only.']);
        exit;
    }

    // Check if ID already exists
    $checkSql = "SELECT id FROM drainage_points WHERE id = '$id'";
    $checkResult = $conn->query($checkSql);
    if ($checkResult && $checkResult->num_rows > 0) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'message' => 'ID already exists. Please choose a different ID.']);
        exit;
    }

    $name = $conn->real_escape_string($data['name']);
    $type = $conn->real_escape_string($data['type']);
    $status = $conn->real_escape_string($data['status']);
    $depth = isset($data['depth']) ? (float)$data['depth'] : 0;
    $invert_level = $conn->real_escape_string($data['invert_level'] ?? 'N/A');
    $reduced_level = $conn->real_escape_string($data['reduced_level'] ?? 'N/A');
    
    // Ensure coordinates is an array with two elements
    if (!is_array($data['coordinates']) || count($data['coordinates']) < 2) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid coordinates format']);
        exit;
    }
    
    $lat = (float)$data['coordinates'][0];
    $lng = (float)$data['coordinates'][1];
    $description = $conn->real_escape_string($data['description'] ?? 'No description available');
    $last_updated = $conn->real_escape_string($data['last_updated'] ?? date('Y-m-d'));
    
    // Handle images
    $images = null;
    if (isset($data['images']) && $data['images']) {
        if (is_string($data['images'])) {
            // Already JSON encoded
            $images = $data['images'];
        } else if (is_array($data['images'])) {
            // Convert array to JSON
            $images = json_encode($data['images']);
        }
        $images = $conn->real_escape_string($images);
    }

    // Insert into database with custom ID
    $sql = "INSERT INTO drainage_points (id, name, type, status, depth, invert_level, reduced_level, latitude, longitude, description, images, last_updated)
            VALUES ('$id', '$name', '$type', '$status', $depth, '$invert_level', '$reduced_level', $lat, $lng, '$description', " . 
            ($images ? "'$images'" : "NULL") . ", '$last_updated')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Point created successfully']);
    } else {
        // Check if it's a duplicate key error
        if (strpos($conn->error, 'Duplicate entry') !== false) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'ID already exists. Please choose a different ID.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save data: ' . $conn->error]);
        }
    }
    exit;
}

// Handle PUT request to update data
if ($requestMethod === 'PUT') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    file_put_contents($logFile, "PUT data decoded: " . json_encode($data) . "\n", FILE_APPEND);
    
    // Validate data
    if (!isset($data['id'], $data['name'], $data['type'], $data['status'], $data['coordinates'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid data: Required fields missing for update']);
        exit;
    }
    
    $newId = trim(strtoupper($data['id']));
    $originalId = isset($data['originalId']) ? $data['originalId'] : $newId;
    
    // Validate new ID format
    if (!preg_match('/^[A-Z0-9]{2,20}$/', $newId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid ID format. Use 2-20 alphanumeric characters only.']);
        exit;
    }
    
    // If ID is changing, check if new ID already exists
    if ($newId !== $originalId) {
        $checkSql = "SELECT id FROM drainage_points WHERE id = '$newId'";
        $checkResult = $conn->query($checkSql);
        if ($checkResult && $checkResult->num_rows > 0) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'New ID already exists. Please choose a different ID.']);
            exit;
        }
    }
    
    $name = $conn->real_escape_string($data['name']);
    $type = $conn->real_escape_string($data['type']);
    $status = $conn->real_escape_string($data['status']);
    $depth = isset($data['depth']) ? (float)$data['depth'] : 0;
    $invert_level = $conn->real_escape_string($data['invert_level'] ?? 'N/A');
    $reduced_level = $conn->real_escape_string($data['reduced_level'] ?? 'N/A');
    
    // Ensure coordinates is an array with two elements
    if (!is_array($data['coordinates']) || count($data['coordinates']) < 2) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid coordinates format']);
        exit;
    }
    
    $lat = (float)$data['coordinates'][0];
    $lng = (float)$data['coordinates'][1];
    $description = $conn->real_escape_string($data['description'] ?? 'No description available');
    $last_updated = date('Y-m-d'); // Update to current date
    
    // Handle images for update
    $imagesSql = "";
    if (isset($data['images'])) {
        if ($data['images'] === null || $data['images'] === '') {
            $imagesSql = ", images = NULL";
        } else {
            $images = null;
            if (is_string($data['images'])) {
                // Already JSON encoded
                $images = $data['images'];
            } else if (is_array($data['images'])) {
                // Convert array to JSON
                $images = json_encode($data['images']);
            }
            if ($images) {
                $images = $conn->real_escape_string($images);
                $imagesSql = ", images = '$images'";
            }
        }
    }
    
    // Update database - handle ID change if necessary
    $sql = "UPDATE drainage_points SET 
            id = '$newId',
            name = '$name',
            type = '$type',
            status = '$status',
            depth = $depth,
            invert_level = '$invert_level',
            reduced_level = '$reduced_level',
            latitude = $lat,
            longitude = $lng,
            description = '$description',
            last_updated = '$last_updated'
            $imagesSql
            WHERE id = '$originalId'";
    
    file_put_contents($logFile, "PUT Original ID: " . $originalId . ", New ID: " . $newId . "\n", FILE_APPEND);
    file_put_contents($logFile, "SQL: " . $sql . "\n", FILE_APPEND);
    
    if ($conn->query($sql) === TRUE) {
        file_put_contents($logFile, "Affected rows: " . $conn->affected_rows . "\n", FILE_APPEND);
        
        if ($conn->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Point updated successfully', 'newId' => $newId]);
        } else {
            // If no rows were affected, check if the record exists
            $check_sql = "SELECT id FROM drainage_points WHERE id = '$originalId'";
            $result = $conn->query($check_sql);
            
            if ($result && $result->num_rows > 0) {
                // Record exists but no changes were made
                echo json_encode(['success' => true, 'message' => 'No changes made to point']);
            } else {
                // Record doesn't exist
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Point not found']);
            }
        }
    } else {
        file_put_contents($logFile, "SQL Error: " . $conn->error . "\n", FILE_APPEND);
        
        // Check if it's a duplicate key error
        if (strpos($conn->error, 'Duplicate entry') !== false) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'New ID already exists. Please choose a different ID.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update data: ' . $conn->error]);
        }
    }
    exit;
}

// Handle DELETE request
if ($requestMethod === 'DELETE') {
    // Parse URL to get ID parameter
    $params = [];
    parse_str($_SERVER['QUERY_STRING'], $params);
    
    file_put_contents($logFile, "DELETE params: " . json_encode($params) . "\n", FILE_APPEND);
    
    if (!isset($params['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID parameter is required']);
        exit;
    }
    
    $id = $conn->real_escape_string($params['id']);
    
    // Get the point data first to delete associated images
    $getSql = "SELECT images FROM drainage_points WHERE id = '$id'";
    $getResult = $conn->query($getSql);
    
    if ($getResult && $getResult->num_rows > 0) {
        $row = $getResult->fetch_assoc();
        $images = $row['images'];
        
        // Delete associated image files
        if ($images) {
            try {
                $imageUrls = json_decode($images, true);
                if (is_array($imageUrls)) {
                    foreach ($imageUrls as $imageUrl) {
                        // Extract filename from URL and delete file
                        $filename = basename($imageUrl);
                        $filepath = "../uploads/" . $filename;
                        if (file_exists($filepath)) {
                            unlink($filepath);
                        }
                    }
                }
            } catch (Exception $e) {
                // Log error but continue with deletion
                file_put_contents($logFile, "Error deleting images: " . $e->getMessage() . "\n", FILE_APPEND);
            }
        }
    }
    
    // Delete from database
    $sql = "DELETE FROM drainage_points WHERE id = '$id'";
    
    if ($conn->query($sql) === TRUE) {
        if ($conn->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Point deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Point not found']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete data: ' . $conn->error]);
    }
    exit;
}

// If the request method is not supported
http_response_code(405); // Method Not Allowed
echo json_encode(['success' => false, 'message' => 'Invalid request method: ' . $requestMethod]);
$conn->close();
?>