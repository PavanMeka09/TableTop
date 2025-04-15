<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['error' => 'Unauthorized access.']);
    exit;
}

function log_error($msg) {
    error_log($msg, 3, __DIR__ . '/../error.log');
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM orders WHERE status IN ('pending', 'preparing')");
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch order items for each order
        foreach ($orders as &$order) {
            $order_id = $order['id'];
            $stmt = $pdo->prepare("SELECT oi.quantity, m.name, m.price FROM order_items oi JOIN menu m ON oi.menu_id = m.id WHERE oi.order_id = ?");
            $stmt->execute([$order_id]);
            $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode($orders);
    } catch (PDOException $e) {
        log_error($e->getMessage());
        echo json_encode(['error' => 'Failed to get orders.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>