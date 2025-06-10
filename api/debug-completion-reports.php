<?php
/**
 * Debug Completion Reports Script
 * Run this to diagnose what's wrong with your completion reports
 */

header('Content-Type: application/json');

// Database configuration
$config = [
    'host' => 'localhost',
    'dbname' => 'drainageinventory', 
    'username' => 'root',
    'password' => ''
];

try {
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4",
        $config['username'],
        $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $debug = [];

    // 1. Check if tables exist
    $debug['tables'] = [];
    
    $tables = ['maintenance_requests', 'inspection_schedules', 'drainage_points', 'users'];
    foreach ($tables as $table) {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        $debug['tables'][$table] = $stmt->rowCount() > 0;
    }

    // 2. Check maintenance_requests structure
    if ($debug['tables']['maintenance_requests']) {
        $stmt = $pdo->prepare("DESCRIBE maintenance_requests");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $required_columns = [
            'id', 'status', 'completion_date', 'hours_worked', 
            'work_summary', 'completion_notes', 'findings', 'recommendations'
        ];
        
        $debug['maintenance_columns'] = [];
        foreach ($required_columns as $col) {
            $debug['maintenance_columns'][$col] = in_array($col, $columns);
        }
    }

    // 3. Check inspection_schedules structure
    if ($debug['tables']['inspection_schedules']) {
        $stmt = $pdo->prepare("DESCRIBE inspection_schedules");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $required_columns = [
            'id', 'status', 'completion_date', 'hours_worked',
            'completion_notes', 'findings', 'recommendations'
        ];
        
        $debug['inspection_columns'] = [];
        foreach ($required_columns as $col) {
            $debug['inspection_columns'][$col] = in_array($col, $columns);
        }
    }

    // 4. Check for completed tasks
    $debug['completed_tasks'] = [];
    
    if ($debug['tables']['maintenance_requests']) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM maintenance_requests WHERE status = 'Completed'");
        $stmt->execute();
        $debug['completed_tasks']['maintenance'] = $stmt->fetchColumn();
        
        // Get sample of completed maintenance
        $stmt = $pdo->prepare("
            SELECT id, status, completion_date, hours_worked, work_summary 
            FROM maintenance_requests 
            WHERE status = 'Completed' 
            LIMIT 3
        ");
        $stmt->execute();
        $debug['sample_maintenance'] = $stmt->fetchAll();
    }

    if ($debug['tables']['inspection_schedules']) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM inspection_schedules WHERE status = 'Completed'");
        $stmt->execute();
        $debug['completed_tasks']['inspection'] = $stmt->fetchColumn();
        
        // Get sample of completed inspections
        $stmt = $pdo->prepare("
            SELECT id, status, completion_date, hours_worked, completion_notes
            FROM inspection_schedules 
            WHERE status = 'Completed' 
            LIMIT 3
        ");
        $stmt->execute();
        $debug['sample_inspections'] = $stmt->fetchAll();
    }

    // 5. Test the actual completion reports query
    if ($debug['tables']['maintenance_requests'] && $debug['tables']['inspection_schedules']) {
        try {
            $maintenanceQuery = "
                SELECT 
                    CONCAT('MR-', mr.id) as id,
                    mr.request_number as task_number,
                    'maintenance' as task_type,
                    mr.request_type as type_detail,
                    dp.name as location,
                    CONCAT(COALESCE(u_assigned.first_name, ''), ' ', COALESCE(u_assigned.last_name, '')) as operator_name,
                    mr.completion_date,
                    mr.hours_worked,
                    mr.work_summary,
                    'pending_review' as status
                FROM maintenance_requests mr
                LEFT JOIN drainage_points dp ON mr.drainage_point_id = dp.id
                LEFT JOIN users u_assigned ON mr.assigned_to = u_assigned.id
                WHERE mr.status = 'Completed'
                LIMIT 5
            ";

            $stmt = $pdo->prepare($maintenanceQuery);
            $stmt->execute();
            $debug['maintenance_query_result'] = $stmt->fetchAll();

            $inspectionQuery = "
                SELECT 
                    CONCAT('IS-', ins.id) as id,
                    ins.schedule_number as task_number,
                    'inspection' as task_type,
                    ins.inspection_type as type_detail,
                    dp.name as location,
                    CONCAT(COALESCE(u_operator.first_name, ''), ' ', COALESCE(u_operator.last_name, '')) as operator_name,
                    ins.completion_date,
                    ins.hours_worked,
                    ins.completion_notes as work_summary,
                    'pending_review' as status
                FROM inspection_schedules ins
                LEFT JOIN drainage_points dp ON ins.drainage_point_id = dp.id
                LEFT JOIN users u_operator ON ins.operator_id = u_operator.id
                WHERE ins.status = 'Completed'
                LIMIT 5
            ";

            $stmt = $pdo->prepare($inspectionQuery);
            $stmt->execute();
            $debug['inspection_query_result'] = $stmt->fetchAll();

        } catch (Exception $e) {
            $debug['query_error'] = $e->getMessage();
        }
    }

    // 6. Check users table
    if ($debug['tables']['users']) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users");
        $stmt->execute();
        $debug['user_count'] = $stmt->fetchColumn();
        
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, role FROM users LIMIT 5");
        $stmt->execute();
        $debug['sample_users'] = $stmt->fetchAll();
    }

    // 7. Check drainage_points
    if ($debug['tables']['drainage_points']) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM drainage_points");
        $stmt->execute();
        $debug['drainage_points_count'] = $stmt->fetchColumn();
        
        $stmt = $pdo->prepare("SELECT id, name FROM drainage_points LIMIT 5");
        $stmt->execute();
        $debug['sample_drainage_points'] = $stmt->fetchAll();
    }

    // 8. Overall diagnosis
    $debug['diagnosis'] = [];
    
    if (!$debug['tables']['maintenance_requests']) {
        $debug['diagnosis'][] = "❌ maintenance_requests table missing";
    }
    
    if (!$debug['tables']['inspection_schedules']) {
        $debug['diagnosis'][] = "❌ inspection_schedules table missing";
    }
    
    if (($debug['completed_tasks']['maintenance'] ?? 0) == 0 && 
        ($debug['completed_tasks']['inspection'] ?? 0) == 0) {
        $debug['diagnosis'][] = "❌ No completed tasks found - operators need to complete some tasks first";
    }
    
    if (($debug['user_count'] ?? 0) == 0) {
        $debug['diagnosis'][] = "❌ No users in database";
    }
    
    if (($debug['drainage_points_count'] ?? 0) == 0) {
        $debug['diagnosis'][] = "❌ No drainage points in database";
    }

    $missing_maintenance_columns = array_filter($debug['maintenance_columns'] ?? [], function($exists) { return !$exists; });
    if (!empty($missing_maintenance_columns)) {
        $debug['diagnosis'][] = "❌ Missing maintenance columns: " . implode(', ', array_keys($missing_maintenance_columns));
    }

    $missing_inspection_columns = array_filter($debug['inspection_columns'] ?? [], function($exists) { return !$exists; });
    if (!empty($missing_inspection_columns)) {
        $debug['diagnosis'][] = "❌ Missing inspection columns: " . implode(', ', array_keys($missing_inspection_columns));
    }

    if (empty($debug['diagnosis'])) {
        $debug['diagnosis'][] = "✅ Database structure looks good!";
        
        if (($debug['completed_tasks']['maintenance'] ?? 0) > 0 || 
            ($debug['completed_tasks']['inspection'] ?? 0) > 0) {
            $debug['diagnosis'][] = "✅ Found completed tasks - completion reports should work";
        }
    }

    echo json_encode($debug, JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'suggestion' => 'Check your database configuration and ensure MySQL is running'
    ], JSON_PRETTY_PRINT);
}
?>