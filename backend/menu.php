<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// function validate_csrf_token($token) {
//     return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
// }

function log_error($msg) {
    error_log($msg, 3, __DIR__ . '/../error.log');
}

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
    // $csrf_token = $_POST['csrf_token'] ?? '';

    // if (!validate_csrf_token($csrf_token)) {
    //     echo json_encode(['error' => 'Invalid CSRF token.']);
    //     http_response_code(403);
    //     exit;
    // }

    if ($action === 'add_menu_item') {
        if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized access.']);
            exit;
        }

        $name = htmlspecialchars(trim($_POST['name'] ?? ''));
        $description = htmlspecialchars(trim($_POST['description'] ?? ''));
        $price = floatval($_POST['price'] ?? 0);
        $category = htmlspecialchars(trim($_POST['category'] ?? ''));
        $image_url = $_POST['image_url'] ?? '';

        // Handle file upload if present
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $target = '../assets/images/menu/' . basename($_FILES['image']['name']);
            if (move_uploaded_file($_FILES['image']['tmp_name'], $target)) {
                $image_url = $target;
            }
        }

        if (empty($name) || $price <= 0) {
            echo json_encode(['status' => 'error', 'message' => 'Name and valid price are required.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO menu (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$name, $description, $price, $category, $image_url]);
            echo json_encode(['status' => 'success', 'message' => 'Menu item added successfully.']);
        } catch (PDOException $e) {
            log_error($e->getMessage());
            echo json_encode(['status' => 'error', 'message' => 'Failed to add menu item.']);
        }
    } elseif ($action === 'update_menu_item') {
        if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $id = $_POST['id'] ?? '';
        $name = htmlspecialchars(trim($_POST['name'] ?? ''));
        $description = htmlspecialchars(trim($_POST['description'] ?? ''));
        $price = floatval($_POST['price'] ?? 0);
        $category = htmlspecialchars(trim($_POST['category'] ?? ''));
        $image_url = $_POST['image_url'] ?? '';

        if (empty($id) || empty($name) || $price <= 0) {
            echo json_encode(['error' => 'ID, name, and valid price are required.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE menu SET name = ?, description = ?, price = ?, category = ?, image_url = ? WHERE id = ?");
            $stmt->execute([$name, $description, $price, $category, $image_url, $id]);
            echo json_encode(['success' => 'Menu item updated successfully.']);
        } catch (PDOException $e) {
            log_error($e->getMessage());
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
            log_error($e->getMessage());
            echo json_encode(['error' => 'Failed to delete menu item.']);
        }
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}