<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'place_order') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $user_id = $_SESSION['user_id'];
        $items = $_POST['items'] ?? []; // Array of menu_id and quantity
        $total_price = 0;

        if (empty($items)) {
            echo json_encode(['error' => 'No items selected.']);
            exit;
        }

        try {
            // Calculate total price
            foreach ($items as $item) {
                $menu_id = $item['menu_id'];
                $quantity = $item['quantity'];

                $stmt = $pdo->prepare("SELECT price FROM menu WHERE id = ?");
                $stmt->execute([$menu_id]);
                $menu_item = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$menu_item) {
                    echo json_encode(['error' => 'Invalid menu item.']);
                    exit;
                }

                $total_price += $menu_item['price'] * $quantity;
            }

            // Create order
            $stmt = $pdo->prepare("INSERT INTO orders (user_id, total_price) VALUES (?, ?)");
            $stmt->execute([$user_id, $total_price]);
            $order_id = $pdo->lastInsertId();

            // Create order items
            foreach ($items as $item) {
                $menu_id = $item['menu_id'];
                $quantity = $item['quantity'];

                $stmt = $pdo->prepare("INSERT INTO order_items (order_id, menu_id, quantity) VALUES (?, ?, ?)");
                $stmt->execute([$order_id, $menu_id, $quantity]);
            }

            echo json_encode(['success' => 'Order placed successfully.', 'order_id' => $order_id]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to place order.']);
        }
    } elseif ($action === 'update_status') {
        if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $order_id = $_POST['order_id'] ?? '';
        $status = $_POST['status'] ?? '';

        if (empty($order_id) || empty($status)) {
            echo json_encode(['error' => 'Order ID and status are required.']);
            exit;
        }

        $allowed_statuses = ['pending', 'preparing', 'on the way', 'delivered'];
        if (!in_array($status, $allowed_statuses)) {
            echo json_encode(['error' => 'Invalid status.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->execute([$status, $order_id]);
            echo json_encode(['success' => 'Order status updated successfully.']);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to update order status.']);
        }
    } elseif ($action === 'get_orders') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $user_id = $_SESSION['user_id'];

        try {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($orders);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to get orders.']);
        }
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>