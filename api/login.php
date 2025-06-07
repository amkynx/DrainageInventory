<?php
/**
 * DrainTrack Authentication System - Debug Version
 * Secure login handler for drainage inventory management
 * 
 * @author DrainTrack Systems
 * @version 1.0
 */

// Security configuration
error_reporting(0); // Disable error display in production
ini_set('display_errors', 0);

// Set security headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Start secure session
session_start();

// Database configuration
$config = [
    'db_host' => 'localhost',
    'db_name' => 'drainageinventory',
    'db_user' => 'root',
    'db_pass' => '',
    'max_login_attempts' => 5,
    'lockout_duration' => 900, // 15 minutes
    'session_lifetime' => 3600  // 1 hour
];

/**
 * Initialize database connection
 */
function initializeDatabase($config) {
    try {
        $pdo = new PDO(
            "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
            $config['db_user'],
            $config['db_pass'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        respondWithError('Service temporarily unavailable');
    }
}

/**
 * Main request handler
 */
function handleRequest($config) {
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respondWithError('Method not allowed', 405);
    }

    // Validate required fields
    if (empty($_POST['email']) || empty($_POST['password'])) {
        respondWithError('Email and password are required');
    }

    // Sanitize and validate input
    $email = filter_var(trim($_POST['email']), FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'];
    $rememberMe = !empty($_POST['remember']) && $_POST['remember'] === '1';

    if (!$email) {
        respondWithError('Please enter a valid email address');
    }

    // Initialize database
    $pdo = initializeDatabase($config);
    
    // Perform authentication
    authenticateUser($pdo, $email, $password, $rememberMe, $config);
}

/**
 * Authenticate user credentials
 */
function authenticateUser($pdo, $email, $password, $rememberMe, $config) {
    // Get user from database
    $user = getUserByEmail($pdo, $email);
    
    if (!$user) {
        logSecurityEvent($pdo, null, 'failed_login', "Login attempt with non-existent email: {$email}");
        respondWithError('Invalid email or password');
    }

    // Check account status
    if ($user['status'] !== 'Active') {
        logSecurityEvent($pdo, $user['id'], 'inactive_login', "Login attempt on inactive account");
        respondWithError('Your account is not active. Please contact an administrator.');
    }

    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        handleFailedLogin($pdo, $user['id'], $email);
        respondWithError('Invalid email or password');
    }

    // Successful authentication
    handleSuccessfulLogin($pdo, $user, $rememberMe, $config);
}

/**
 * Get user by email address
 */
function getUserByEmail($pdo, $email) {
    $stmt = $pdo->prepare("
        SELECT id, first_name, last_name, email, password_hash, role, status, 
               failed_login_attempts, locked_until, last_login
        FROM users 
        WHERE email = ? AND status = 'Active'
    ");
    $stmt->execute([$email]);
    return $stmt->fetch();
}

/**
 * Handle failed login attempt
 */
function handleFailedLogin($pdo, $userId, $email) {
    // Increment failed attempts
    $stmt = $pdo->prepare("
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1 
        WHERE id = ?
    ");
    $stmt->execute([$userId]);
    
    // Log security event
    logSecurityEvent($pdo, $userId, 'failed_login', "Failed login attempt for: {$email}");
}

/**
 * Handle successful login
 */
function handleSuccessfulLogin($pdo, $user, $rememberMe, $config) {
    // Reset failed attempts
    $stmt = $pdo->prepare("
        UPDATE users 
        SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() 
        WHERE id = ?
    ");
    $stmt->execute([$user['id']]);

    // Create user session
    createUserSession($user, $rememberMe, $config);
    
    // Log successful login
    logSecurityEvent($pdo, $user['id'], 'successful_login', "User logged in successfully");
    
    // Determine redirect URL based on role
    $redirectUrl = getRedirectUrl($user['role']);
    
    // DEBUG: Log the role and redirect URL
    error_log("DEBUG - User Role: '" . $user['role'] . "' | Redirect URL: '" . $redirectUrl . "'");
    
    // Return success response
    respondWithSuccess('Login successful', [
        'redirect' => $redirectUrl,
        'user' => [
            'id' => $user['id'],
            'name' => trim($user['first_name'] . ' ' . $user['last_name']),
            'email' => $user['email'],
            'role' => $user['role']
        ],
        'debug' => [
            'original_role' => $user['role'],
            'role_length' => strlen($user['role']),
            'role_bytes' => bin2hex($user['role']),
            'redirect_url' => $redirectUrl
        ]
    ]);
}

/**
 * Create secure user session
 */
function createUserSession($user, $rememberMe, $config) {
    // Regenerate session ID for security
    session_regenerate_id(true);
    
    // Set session variables
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_name'] = trim($user['first_name'] . ' ' . $user['last_name']);
    $_SESSION['login_time'] = time();
    $_SESSION['last_activity'] = time();
    
    // Set session lifetime
    $lifetime = $rememberMe ? (30 * 24 * 60 * 60) : $config['session_lifetime']; // 30 days or 1 hour
    
    // Configure session cookie
    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path' => '/',
        'domain' => '',
        'secure' => isset($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
}

/**
 * Get redirect URL based on user role
 * Updated to redirect to role-specific directories with debug info
 */
function getRedirectUrl($role) {
    // Trim any whitespace and normalize the role
    $normalizedRole = trim($role);
    
    $redirectMap = [
        'Admin' => 'admin/admin.html',
        'Inspector' => 'inspector/inspector.html',
        'Operator' => 'operator/operator.html',
        'Viewer' => 'admin/admin.html' // Default viewers to admin dashboard
    ];
    
    // Log debug information
    error_log("DEBUG - getRedirectUrl called with role: '" . $role . "'");
    error_log("DEBUG - Normalized role: '" . $normalizedRole . "'");
    error_log("DEBUG - Available roles: " . implode(', ', array_keys($redirectMap)));
    
    // Check if the role exists in our map
    if (array_key_exists($normalizedRole, $redirectMap)) {
        $redirectUrl = $redirectMap[$normalizedRole];
        error_log("DEBUG - Found exact match, redirecting to: " . $redirectUrl);
        return $redirectUrl;
    }
    
    // Try case-insensitive matching
    foreach ($redirectMap as $mapRole => $url) {
        if (strcasecmp($normalizedRole, $mapRole) === 0) {
            error_log("DEBUG - Found case-insensitive match for '{$normalizedRole}' with '{$mapRole}', redirecting to: " . $url);
            return $url;
        }
    }
    
    // If no match found, log and return default
    error_log("DEBUG - No match found for role '{$normalizedRole}', using default admin/admin.html");
    return 'admin/admin.html';
}

/**
 * Log security events
 */
function logSecurityEvent($pdo, $userId, $action, $description) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO user_activity_log (user_id, action, description, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userId,
            $action,
            $description,
            getClientIP(),
            $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        ]);
    } catch (Exception $e) {
        error_log("Failed to log security event: " . $e->getMessage());
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
 * Send success response
 */
function respondWithSuccess($message, $data = []) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('c')
    ]);
    exit;
}

/**
 * Send error response
 */
function respondWithError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $message,
        'timestamp' => date('c')
    ]);
    exit;
}

// Execute main handler
try {
    handleRequest($config);
} catch (Exception $e) {
    error_log("Login system error: " . $e->getMessage());
    respondWithError('An unexpected error occurred. Please try again.');
}
?>