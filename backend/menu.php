<?php
// backend/menu.php
session_start();
header("Content-Type: application/json");
require_once 'config.php';

try {
    $stmt = $db->prepare("SELECT * FROM menu");
    $stmt->execute();
    $menuItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "status" => "success",
        "data" => $menuItems
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to fetch menu items",
        "error" => $e->getMessage()
    ]);
}
