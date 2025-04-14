<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['error' => 'Unauthorized access.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'get_all_orders') {
        try {
            $stmt = $pdo->query("SELECT * FROM orders");
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($orders);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to get orders.']);
        }
    } elseif ($action === 'get_all_reservations') {
        try {
            $stmt = $pdo->query("SELECT * FROM reservations");
            $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($reservations);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to get reservations.']);
        }
    } elseif ($action === 'get_all_feedback') {
        try {
            $stmt = $pdo->query("SELECT * FROM feedback");
            $feedback = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($feedback);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to get feedback.']);
        }
    } elseif ($action === 'get_quick_stats') {
        if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        try {
            $stmt = $pdo->query("SELECT COUNT(*) AS pending_orders FROM orders WHERE status = 'pending'");
            $pendingOrders = $stmt->fetch(PDO::FETCH_ASSOC)['pending_orders'];

            $stmt = $pdo->query("SELECT COUNT(*) AS new_feedback FROM feedback");
            $newFeedback = $stmt->fetch(PDO::FETCH_ASSOC)['new_feedback'];

            $stmt = $pdo->query("SELECT COUNT(*) AS menu_items FROM menu");
            $menuItems = $stmt->fetch(PDO::FETCH_ASSOC)['menu_items'];

            echo json_encode([
                'pending_orders' => $pendingOrders,
                'new_feedback' => $newFeedback,
                'menu_items' => $menuItems
            ]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to fetch quick stats.']);
        }
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>