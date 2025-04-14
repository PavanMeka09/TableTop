<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM menu");
        $menuItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $menuItems]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch menu items.']);
    }
} elseif ($method === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'add_menu_item') {
        if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized access.']);
            exit;
        }

        $name = $_POST['name'] ?? '';
        $description = $_POST['description'] ?? '';
        $price = $_POST['price'] ?? '';
        $category = $_POST['category'] ?? '';
        $image_url = $_POST['image_url'] ?? '';

        if (empty($name) || empty($price)) {
            echo json_encode(['status' => 'error', 'message' => 'Name and price are required.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO menu (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$name, $description, $price, $category, $image_url]);
            echo json_encode(['status' => 'success', 'message' => 'Menu item added successfully.']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add menu item.']);
        }
    } elseif ($action === 'update_menu_item') {
        if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $id = $_POST['id'] ?? '';
        $name = $_POST['name'] ?? '';
        $description = $_POST['description'] ?? '';
        $price = $_POST['price'] ?? '';
        $category = $_POST['category'] ?? '';
        $image_url = $_POST['image_url'] ?? '';

        if (empty($id) || empty($name) || empty($price)) {
            echo json_encode(['error' => 'ID, name, and price are required.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE menu SET name = ?, description = ?, price = ?, category = ?, image_url = ? WHERE id = ?");
            $stmt->execute([$name, $description, $price, $category, $image_url, $id]);
            echo json_encode(['success' => 'Menu item updated successfully.']);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to update menu item.']);
        }
    } elseif ($action === 'delete_menu_item') {
        if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $id = $_POST['id'] ?? '';

        if (empty($id)) {
            echo json_encode(['error' => 'ID is required.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM menu WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => 'Menu item deleted successfully.']);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to delete menu item.']);
        }
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}