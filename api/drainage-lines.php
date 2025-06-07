<?php
header('Content-Type: application/json');

// Database connection
$host = 'localhost';
$db = 'DrainageInventory';
$user = 'root';
$pass = ''; // Replace with your MySQL password

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed']));
}

// Fetch GeoJSON data
$sql = "SELECT geojson FROM drainage_lines WHERE name = 'Bentayan Jln Bakri'";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo $row['geojson'];
} else {
    echo json_encode(['error' => 'No data found']);
}

$conn->close();
?>