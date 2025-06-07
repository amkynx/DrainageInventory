<?php
// users-api.php - Simple PHP API for user management
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration (adjust according to your setup)
$host = 'localhost';
$dbname = 'drainageinventory';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Routes
switch ($method) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'stats') {
            getUserStats($pdo);
        } else {
            getUsers($pdo);
        }
        break;
    
    case 'POST':
        createUser($pdo);
        break;
    
    case 'PUT':
        updateUser($pdo);
        break;
    
    case 'DELETE':
        deleteUser($pdo);
        break;
    
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

// Get all users with filtering and pagination
function getUsers($pdo) {
    try {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $role = isset($_GET['role']) ? $_GET['role'] : '';
        $status = isset($_GET['status']) ? $_GET['status'] : '';
        
        $offset = ($page - 1) * $limit;
        
        // Build query with filters
        $whereConditions = [];
        $params = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(first_name LIKE :search OR last_name LIKE :search OR email LIKE :search)";
            $params['search'] = "%$search%";
        }
        
        if (!empty($role)) {
            $whereConditions[] = "role = :role";
            $params['role'] = $role;
        }
        
        if (!empty($status)) {
            $whereConditions[] = "status = :status";
            $params['status'] = $status;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Get total count
        $countSql = "SELECT COUNT(*) FROM users $whereClause";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $totalUsers = $countStmt->fetchColumn();
        
        // Get users
        $sql = "SELECT id, first_name, last_name, email, phone, role, status, 
                last_login, created_at, updated_at 
                FROM users $whereClause 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $pdo->prepare($sql);
        
        // Bind parameters
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format response
        echo json_encode([
            'success' => true,
            'data' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$totalUsers,
                'pages' => ceil($totalUsers / $limit)
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch users: ' . $e->getMessage()]);
    }
}

// Get user statistics
function getUserStats($pdo) {
    try {
        $sql = "SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_users,
                    SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive_users,
                    SUM(CASE WHEN role = 'Admin' THEN 1 ELSE 0 END) as admin_users,
                    SUM(CASE WHEN role = 'Inspector' THEN 1 ELSE 0 END) as inspector_users,
                    SUM(CASE WHEN role = 'Operator' THEN 1 ELSE 0 END) as operator_users,
                    SUM(CASE WHEN role = 'Viewer' THEN 1 ELSE 0 END) as viewer_users
                FROM users";
        
        $stmt = $pdo->query($sql);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $stats
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch statistics: ' . $e->getMessage()]);
    }
}

// Create new user
function createUser($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required = ['firstName', 'lastName', 'email', 'password', 'role', 'status'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '$field' is required"]);
                return;
            }
        }
        
        // Validate email format
        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email format']);
            return;
        }
        
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = :email");
        $stmt->execute(['email' => $input['email']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Email already exists']);
            return;
        }
        
        // Hash password
        $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
        
        // Insert user
        $sql = "INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status, email_verified) 
                VALUES (:firstName, :lastName, :email, :phone, :passwordHash, :role, :status, 1)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'firstName' => $input['firstName'],
            'lastName' => $input['lastName'],
            'email' => $input['email'],
            'phone' => $input['phone'] ?? null,
            'passwordHash' => $passwordHash,
            'role' => $input['role'],
            'status' => $input['status']
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Log activity
        logActivity($pdo, null, 'user_created', "New user created: {$input['firstName']} {$input['lastName']}");
        
        echo json_encode([
            'success' => true,
            'message' => 'User created successfully',
            'user_id' => $userId
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create user: ' . $e->getMessage()]);
    }
}

// Update user
function updateUser($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID is required']);
            return;
        }
        
        // Check if user exists
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
        $stmt->execute(['id' => $input['id']]);
        $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existingUser) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }
        
        // Build update query
        $updateFields = [];
        $params = ['id' => $input['id']];
        
        $allowedFields = ['firstName' => 'first_name', 'lastName' => 'last_name', 
                         'email' => 'email', 'phone' => 'phone', 'role' => 'role', 'status' => 'status'];
        
        foreach ($allowedFields as $inputField => $dbField) {
            if (isset($input[$inputField])) {
                $updateFields[] = "$dbField = :$inputField";
                $params[$inputField] = $input[$inputField];
            }
        }
        
        // Handle password update
        if (!empty($input['password'])) {
            $updateFields[] = "password_hash = :passwordHash";
            $params['passwordHash'] = password_hash($input['password'], PASSWORD_DEFAULT);
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            return;
        }
        
        // Check email uniqueness if email is being updated
        if (isset($input['email']) && $input['email'] !== $existingUser['email']) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = :email AND id != :id");
            $stmt->execute(['email' => $input['email'], 'id' => $input['id']]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Email already exists']);
                return;
            }
        }
        
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Log activity
        logActivity($pdo, null, 'user_updated', "User updated: {$existingUser['first_name']} {$existingUser['last_name']}");
        
        echo json_encode([
            'success' => true,
            'message' => 'User updated successfully'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update user: ' . $e->getMessage()]);
    }
}

// Delete user
function deleteUser($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID is required']);
            return;
        }
        
        // Check if user exists
        $stmt = $pdo->prepare("SELECT first_name, last_name FROM users WHERE id = :id");
        $stmt->execute(['id' => $input['id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }
        
        // Don't allow deleting the last admin
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE role = 'Admin' AND status = 'Active'");
        $stmt->execute();
        $adminCount = $stmt->fetchColumn();
        
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = :id");
        $stmt->execute(['id' => $input['id']]);
        $userRole = $stmt->fetchColumn();
        
        if ($userRole === 'Admin' && $adminCount <= 1) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete the last active administrator']);
            return;
        }
        
        // Delete user
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute(['id' => $input['id']]);
        
        // Log activity
        logActivity($pdo, null, 'user_deleted', "User deleted: {$user['first_name']} {$user['last_name']}");
        
        echo json_encode([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete user: ' . $e->getMessage()]);
    }
}

// Log user activity
function logActivity($pdo, $userId, $action, $description) {
    try {
        $sql = "INSERT INTO user_activity_log (user_id, action, description, ip_address, user_agent) 
                VALUES (:userId, :action, :description, :ipAddress, :userAgent)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'userId' => $userId,
            'action' => $action,
            'description' => $description,
            'ipAddress' => $_SERVER['REMOTE_ADDR'] ?? null,
            'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    } catch (Exception $e) {
        // Log activity errors shouldn't break the main functionality
        error_log("Activity logging failed: " . $e->getMessage());
    }
}
?>