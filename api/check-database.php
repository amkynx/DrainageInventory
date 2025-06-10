<?php
/**
 * Database Structure Check Script
 * This script checks if the required database tables and columns exist
 * Run this to diagnose database-related issues
 */

header('Content-Type: application/json');

// Database configurations to try
$possible_configs = [
    [
        'host' => 'localhost',
        'dbname' => 'drainageinventory',
        'username' => 'root',
        'password' => ''
    ],
    [
        'host' => 'localhost',
        'dbname' => 'draintrack',
        'username' => 'root',
        'password' => ''
    ],
    [
        'host' => '127.0.0.1',
        'dbname' => 'drainageinventory',
        'username' => 'root',
        'password' => ''
    ]
];

$results = [];
$connected_config = null;
$pdo = null;

// Try to connect to database
foreach ($possible_configs as $config) {
    try {
        $pdo = new PDO(
            "mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4",
            $config['username'],
            $config['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        $connected_config = $config;
        $results['connection'] = [
            'status' => 'success',
            'config' => $config,
            'message' => 'Successfully connected to database'
        ];
        break;
    } catch (PDOException $e) {
        $results['connection_attempts'][] = [
            'config' => $config,
            'error' => $e->getMessage()
        ];
    }
}

if (!$pdo) {
    $results['connection'] = [
        'status' => 'failed',
        'message' => 'Could not connect to any database configuration'
    ];
    echo json_encode($results);
    exit();
}

// Check required tables
$required_tables = [
    'maintenance_requests',
    'inspection_schedules', 
    'drainage_points',
    'users'
];

$results['tables'] = [];

foreach ($required_tables as $table) {
    try {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        $exists = $stmt->rowCount() > 0;
        
        $results['tables'][$table] = [
            'exists' => $exists,
            'columns' => []
        ];
        
        if ($exists) {
            // Get column information
            $stmt = $pdo->prepare("DESCRIBE `$table`");
            $stmt->execute();
            $columns = $stmt->fetchAll();
            
            $results['tables'][$table]['columns'] = array_column($columns, 'Field');
        }
    } catch (PDOException $e) {
        $results['tables'][$table] = [
            'exists' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Check if there's any sample data
$results['sample_data'] = [];

foreach ($required_tables as $table) {
    if ($results['tables'][$table]['exists']) {
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM `$table`");
            $stmt->execute();
            $count = $stmt->fetch()['count'];
            $results['sample_data'][$table] = $count;
        } catch (PDOException $e) {
            $results['sample_data'][$table] = 'error: ' . $e->getMessage();
        }
    }
}

// Check specific requirements for completion reports
$results['completion_requirements'] = [];

// Check if maintenance_requests has required columns for completion
if ($results['tables']['maintenance_requests']['exists']) {
    $required_maintenance_columns = [
        'id', 'drainage_point_id', 'request_type', 'status', 
        'priority', 'description', 'estimated_cost', 'scheduled_date'
    ];
    
    $missing_columns = array_diff($required_maintenance_columns, $results['tables']['maintenance_requests']['columns']);
    $results['completion_requirements']['maintenance_requests'] = [
        'missing_columns' => $missing_columns,
        'has_required_columns' => empty($missing_columns)
    ];
}

// Check if inspection_schedules has required columns
if ($results['tables']['inspection_schedules']['exists']) {
    $required_inspection_columns = [
        'id', 'drainage_point_id', 'inspection_type', 'status',
        'priority', 'scheduled_date'
    ];
    
    $missing_columns = array_diff($required_inspection_columns, $results['tables']['inspection_schedules']['columns']);
    $results['completion_requirements']['inspection_schedules'] = [
        'missing_columns' => $missing_columns,
        'has_required_columns' => empty($missing_columns)
    ];
}

// Check for completed tasks
$results['completed_tasks'] = [];

if ($results['tables']['maintenance_requests']['exists']) {
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM maintenance_requests WHERE status = 'Completed'");
        $stmt->execute();
        $results['completed_tasks']['maintenance'] = $stmt->fetch()['count'];
    } catch (PDOException $e) {
        $results['completed_tasks']['maintenance'] = 'error: ' . $e->getMessage();
    }
}

if ($results['tables']['inspection_schedules']['exists']) {
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM inspection_schedules WHERE status = 'Completed'");
        $stmt->execute();
        $results['completed_tasks']['inspection'] = $stmt->fetch()['count'];
    } catch (PDOException $e) {
        $results['completed_tasks']['inspection'] = 'error: ' . $e->getMessage();
    }
}

// Check PHP configuration
$results['php_info'] = [
    'version' => phpversion(),
    'pdo_mysql' => extension_loaded('pdo_mysql'),
    'mysqli' => extension_loaded('mysqli'),
    'session_started' => session_status() === PHP_SESSION_ACTIVE,
    'error_reporting' => error_reporting(),
    'display_errors' => ini_get('display_errors')
];

// Overall health check
$results['health_check'] = [
    'database_connected' => $connected_config !== null,
    'all_tables_exist' => !in_array(false, array_column($results['tables'], 'exists')),
    'has_completed_tasks' => 
        ($results['completed_tasks']['maintenance'] ?? 0) > 0 || 
        ($results['completed_tasks']['inspection'] ?? 0) > 0,
    'php_extensions_ok' => extension_loaded('pdo_mysql')
];

echo json_encode($results, JSON_PRETTY_PRINT);
?>