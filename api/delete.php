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

// Database connection
$host = 'localhost';
$db = 'DrainageInventory';
$user = 'root';
$pass = ''; // Replace with your MySQL password

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Handle GET request to fetch data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if a specific ID is requested
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $sql = "SELECT id, name, type, status, depth, invert_level, reduced_level, latitude, longitude, description, last_updated FROM drainage_points WHERE id = $id";
    } else {
        $sql = "SELECT id, name, type, status, depth, invert_level, reduced_level, latitude, longitude, description, last_updated FROM drainage_points";
    }
    
    $result = $conn->query($sql);

    if ($result) {
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'type' => $row['type'],
                'status' => $row['status'],
                'depth' => (float)$row['depth'],
                'invert_level' => $row['invert_level'],
                'reduced_level' => $row['reduced_level'],
                'coordinates' => [(float)$row['latitude'], (float)$row['longitude']],
                'description' => $row['description'],
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
        echo json_encode(['success' => false, 'message' => 'Failed to fetch data: ' . $conn->error]);
    }
    exit;
}

// Handle POST request to create new data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate data
    if (!isset($data['name'], $data['type'], $data['status'], $data['coordinates'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid data: Required fields missing']);
        exit;
    }

    $name = $conn->real_escape_string($data['name']);
    $type = $conn->real_escape_string($data['type']);
    $status = $conn->real_escape_string($data['status']);
    $depth = isset($data['depth']) ? (float)$data['depth'] : 0;
    $invert_level = $conn->real_escape_string($data['invert_level'] ?? 'N/A');
    $reduced_level = $conn->real_escape_string($data['reduced_level'] ?? 'N/A');
    $lat = (float)$data['coordinates'][0];
    $lng = (float)$data['coordinates'][1];
    $description = $conn->real_escape_string($data['description'] ?? 'No description available');
    $last_updated = $conn->real_escape_string($data['last_updated'] ?? date('Y-m-d'));

    // Insert into database
    $sql = "INSERT INTO drainage_points (name, type, status, depth, invert_level, reduced_level, latitude, longitude, description, last_updated)
            VALUES ('$name', '$type', '$status', $depth, '$invert_level', '$reduced_level', $lat, $lng, '$description', '$last_updated')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id, 'message' => 'Point created successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save data: ' . $conn->error]);
    }
    exit;
}

// Handle PUT request to update data
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate data
    if (!isset($data['id'], $data['name'], $data['type'], $data['status'], $data['coordinates'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid data: Required fields missing for update']);
        exit;
    }
    
    $id = (int)$data['id'];
    $name = $conn->real_escape_string($data['name']);
    $type = $conn->real_escape_string($data['type']);
    $status = $conn->real_escape_string($data['status']);
    $depth = isset($data['depth']) ? (float)$data['depth'] : 0;
    $invert_level = $conn->real_escape_string($data['invert_level'] ?? 'N/A');
    $reduced_level = $conn->real_escape_string($data['reduced_level'] ?? 'N/A');
    $lat = (float)$data['coordinates'][0];
    $lng = (float)$data['coordinates'][1];
    $description = $conn->real_escape_string($data['description'] ?? 'No description available');
    $last_updated = date('Y-m-d'); // Update to current date
    
    // Update database
    $sql = "UPDATE drainage_points SET 
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
            WHERE id = $id";
    
    if ($conn->query($sql) === TRUE) {
        if ($conn->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Point updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No changes made or point not found']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update data: ' . $conn->error]);
    }
    exit;
}

// Handle DELETE request
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Parse URL to get ID parameter
    $params = [];
    parse_str($_SERVER['QUERY_STRING'], $params);
    
    if (!isset($params['id'])) {
        echo json_encode(['success' => false, 'message' => 'ID parameter is required']);
        exit;
    }
    
    $id = (int)$params['id'];
    
    // Delete from database
    $sql = "DELETE FROM drainage_points WHERE id = $id";
    
    if ($conn->query($sql) === TRUE) {
        if ($conn->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Point deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Point not found']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete data: ' . $conn->error]);
    }
    exit;
}

// If the request method is not supported
echo json_encode(['success' => false, 'message' => 'Invalid request method: ' . $_SERVER['REQUEST_METHOD']]);
$conn->close();
?>