<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

function log_error($msg) {
    error_log($msg, 3, __DIR__ . '/../error.log');
}

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
            // Fetch items for each order
            foreach ($orders as &$order) {
                $order_id = $order['id'];
                $stmtItems = $pdo->prepare("SELECT oi.quantity, m.name, m.price FROM order_items oi JOIN menu m ON oi.menu_id = m.id WHERE oi.order_id = ?");
                $stmtItems->execute([$order_id]);
                $order['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
            }
            echo json_encode(['success' => true, 'data' => $orders]);
        } catch (PDOException $e) {
            log_error('Failed to get orders: ' . $e->getMessage());
            echo json_encode(['success' => false, 'error' => 'Failed to get orders.']);
        }
    } elseif ($action === 'get_all_reservations') {
        try {
            $stmt = $pdo->query("SELECT * FROM reservations");
            $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $reservations]);
        } catch (PDOException $e) {
            log_error('Failed to get reservations: ' . $e->getMessage());
            echo json_encode(['success' => false, 'error' => 'Failed to get reservations.']);
        }
    } elseif ($action === 'get_all_feedback') {
        try {
            $stmt = $pdo->query("SELECT * FROM feedback");
            $feedback = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $feedback]);
        } catch (PDOException $e) {
            log_error('Failed to get feedback: ' . $e->getMessage());
            echo json_encode(['success' => false, 'error' => 'Failed to get feedback.']);
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
                'success' => true,
                'data' => [
                    'pending_orders' => $pendingOrders,
                    'new_feedback' => $newFeedback,
                    'menu_items' => $menuItems
                ]
            ]);
        } catch (PDOException $e) {
            log_error('Failed to fetch quick stats: ' . $e->getMessage());
            echo json_encode(['success' => false, 'error' => 'Failed to fetch quick stats.']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method.']);
}
?>