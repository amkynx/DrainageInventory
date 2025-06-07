<?php
/**
 * DrainTrack Logout API
 * Centralized logout handler for all role-based dashboards
 * 
 * @author DrainTrack Systems
 * @version 1.0
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

/**
 * Log user logout activity
 */
function logLogoutActivity($userId) {
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

        // Log the logout activity
        $stmt = $pdo->prepare("
            INSERT INTO user_activity_log (user_id, action, description, ip_address, user_agent, created_at)
            VALUES (?, 'logout', 'User logged out', ?, ?, NOW())
        ");
        
        $stmt->execute([
            $userId,
            getClientIP(),
            $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        ]);

    } catch (Exception $e) {
        // Log error but don't fail logout process
        error_log("Failed to log logout activity: " . $e->getMessage());
    }
}

/**
 * Get client IP address
 */
function getClientIP() {
    $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    
    foreach ($ipKeys as $key) {
        if (!empty($_SERVER[$key])) {
            $ips = explode(',', $_SERVER[$key]);
            $ip = trim($ips[0]);
            
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Perform secure logout
 */
function performLogout() {
    $wasLoggedIn = isset($_SESSION['user_id']);
    $userId = $_SESSION['user_id'] ?? null;
    $userName = $_SESSION['user_name'] ?? 'Unknown User';

    // Log the logout activity if user was logged in
    if ($wasLoggedIn && $userId) {
        logLogoutActivity($userId);
    }

    // Clear all session variables
    $_SESSION = array();

    // Delete the session cookie if it exists
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    // Destroy the session
    session_destroy();

    return [
        'success' => true,
        'message' => $wasLoggedIn ? "User $userName logged out successfully" : 'Session cleared',
        'was_logged_in' => $wasLoggedIn,
        'timestamp' => date('c')
    ];
}

// Execute logout
try {
    $result = performLogout();
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    
    // Even if there's an error, try to clear the session
    session_destroy();
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error during logout, but session has been cleared',
        'timestamp' => date('c')
    ]);
}
?>