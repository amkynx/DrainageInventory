<?php
// Database configuration
$host = 'localhost';
$dbname = 'DrainageInventory';
$username = 'root';
$password = ''; // Replace with your MySQL password

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    // Set the PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Set default fetch mode to associative array
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Create MySQLi connection for backward compatibility
    $conn = new mysqli($host, $username, $password, $dbname);
    
    // Check MySQLi connection
    if ($conn->connect_error) {
        throw new Exception("MySQLi Connection failed: " . $conn->connect_error);
    }
    
    // Set charset for MySQLi
    $conn->set_charset("utf8mb4");
    
} catch(PDOException $e) {
    error_log("Database connection error: " . $e->getMessage());
    die(json_encode(['error' => 'Database connection failed']));
} catch(Exception $e) {
    error_log("Database error: " . $e->getMessage());
    die(json_encode(['error' => 'Database connection failed']));
}

// Function to get database connection
function getDB() {
    global $pdo;
    return $pdo;
}

// Function to get MySQLi connection
function getMySQLi() {
    global $conn;
    return $conn;
}
?>