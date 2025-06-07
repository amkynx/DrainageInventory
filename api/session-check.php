<?php
/**
 * DrainTrack Session Check API
 * Centralized session validation for all role-based dashboards
 * 
 * @author DrainTrack Systems
 * @version 1.0
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

/**
 * Check if user session is valid and active
 */
function checkUserSession() {
    // Check if essential session variables exist
    if (!isset($_SESSION['user_id']) || 
        !isset($_SESSION['user_email']) || 
        !isset($_SESSION['user_role']) || 
        !isset($_SESSION['login_time'])) {
        return [
            'success' => true,
            'authenticated' => false,
            'message' => 'No active session found'
        ];
    }

    // Check session age (optional - can be configured)
    $sessionLifetime = 8 * 60 * 60; // 8 hours
    if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time']) > $sessionLifetime) {
        // Session expired
        session_destroy();
        return [
            'success' => true,
            'authenticated' => false,
            'message' => 'Session expired'
        ];
    }

    // Update last activity timestamp
    $_SESSION['last_activity'] = time();

    // Validate user still exists and is active in database (optional but recommended)
    $userValid = validateUserInDatabase($_SESSION['user_id']);
    if (!$userValid) {
        session_destroy();
        return [
            'success' => true,
            'authenticated' => false,
            'message' => 'User account no longer valid'
        ];
    }

    // Session is valid
    return [
        'success' => true,
        'authenticated' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'name' => $_SESSION['user_name'],
            'email' => $_SESSION['user_email'],
            'role' => $_SESSION['user_role']
        ],
        'session_info' => [
            'login_time' => $_SESSION['login_time'],
            'last_activity' => $_SESSION['last_activity']
        ]
    ];
}

/**
 * Validate user exists and is active in database
 */
function validateUserInDatabase($userId) {
    try {
        // Database configuration
        $host = 'localhost';
        $dbname = 'drainageinventory';
        $username = 'root';
        $password = '';

        $pdo = new PDO(
            "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );

        $stmt = $pdo->prepare("SELECT id, status FROM users WHERE id = ? AND status = 'Active'");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        return $user !== false;

    } catch (Exception $e) {
        // If database check fails, log error but don't invalidate session
        error_log("Session validation database error: " . $e->getMessage());
        return true; // Assume valid if can't check
    }
}

/**
 * Get role-specific permissions (optional enhancement)
 */
function getRolePermissions($role) {
    $permissions = [
        'Admin' => [
            'view_dashboard' => true,
            'manage_users' => true,
            'manage_drainage_points' => true,
            'view_reports' => true,
            'system_settings' => true
        ],
        'Inspector' => [
            'view_dashboard' => true,
            'manage_inspections' => true,
            'view_drainage_points' => true,
            'create_reports' => true,
            'manage_users' => false
        ],
        'Operator' => [
            'view_dashboard' => true,
            'manage_tasks' => true,
            'view_drainage_points' => true,
            'report_issues' => true,
            'manage_users' => false
        ],
        'Viewer' => [
            'view_dashboard' => true,
            'view_drainage_points' => true,
            'view_reports' => true,
            'manage_users' => false,
            'manage_tasks' => false
        ]
    ];

    return $permissions[$role] ?? $permissions['Viewer'];
}

// Execute session check
try {
    $result = checkUserSession();
    
    // Add role permissions if authenticated
    if ($result['authenticated']) {
        $result['permissions'] = getRolePermissions($result['user']['role']);
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log("Session check error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error during session validation'
    ]);
}
?>