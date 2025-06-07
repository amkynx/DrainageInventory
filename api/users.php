<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
$pass = '';

try {
    $conn = new mysqli($host, $user, $pass, $db);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Handle GET request to fetch users
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check if specific ID is requested
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $sql = "SELECT id, first_name, last_name, email, phone, role, status, last_login, created_at 
                    FROM users WHERE id = $id";
        } else {
            // Get all active users
            $sql = "SELECT id, first_name, last_name, email, phone, role, status, last_login, created_at 
                    FROM users WHERE status = 'Active' ORDER BY first_name, last_name";
        }
        
        $result = $conn->query($sql);
        
        if ($result) {
            $users = [];
            while ($row = $result->fetch_assoc()) {
                $users[] = [
                    'id' => (int)$row['id'],
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'email' => $row['email'],
                    'phone' => $row['phone'],
                    'role' => $row['role'],
                    'status' => $row['status'],
                    'last_login' => $row['last_login'],
                    'created_at' => $row['created_at']
                ];
            }
            
            // If specific ID requested, return single object
            if (isset($_GET['id'])) {
                echo json_encode(!empty($users) ? $users[0] : null);
            } else {
                echo json_encode($users);
            }
        } else {
            throw new Exception('Query failed: ' . $conn->error);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch users: ' . $e->getMessage()]);
    }
    exit;
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed: ' . $_SERVER['REQUEST_METHOD']]);
$conn->close();
?>