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

// Fetch flood-prone areas
$sql = "SELECT id, name, risk_level, last_flood, coordinates FROM flood_prone_areas";
$result = $conn->query($sql);

$data = [];
while ($row = $result->fetch_assoc()) {
    $row['coordinates'] = json_decode($row['coordinates']);
    $data[] = $row;
}

echo json_encode($data);
$conn->close();
?>