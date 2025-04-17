<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

function log_error($msg) {
    error_log($msg, 3, __DIR__ . '/../error.log');
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'place_order') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $user_id = $_SESSION['user_id'];
        $items = json_decode($_POST['items'] ?? '[]', true);
        $address = trim($_POST['address'] ?? '');
        $total_price = 0;

        if (!is_array($items) || empty($items)) {
            echo json_encode(['error' => 'No items selected.']);
            exit;
        }
        if (empty($address)) {
            echo json_encode(['error' => 'Address is required.']);
            exit;
        }

        try {
            $pdo->beginTransaction();

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
            $stmt = $pdo->prepare("INSERT INTO orders (user_id, total_price, address) VALUES (?, ?, ?)");
            $stmt->execute([$user_id, $total_price, $address]);
            $order_id = $pdo->lastInsertId();

            // Create order items
            foreach ($items as $item) {
                $menu_id = $item['menu_id'];
                $quantity = $item['quantity'];

                $stmt = $pdo->prepare("INSERT INTO order_items (order_id, menu_id, quantity) VALUES (?, ?, ?)");
                $stmt->execute([$order_id, $menu_id, $quantity]);
            }

            $pdo->commit();
            echo json_encode(['success' => 'Order placed successfully.', 'order_id' => $order_id]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            log_error($e->getMessage());
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
            // Fetch orders with address
            $stmt = $pdo->prepare("SELECT id, total_price, created_at, status, address FROM orders WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch order items for each order
            foreach ($orders as &$order) {
                $order_id = $order['id'];
                $stmtItems = $pdo->prepare("SELECT oi.quantity, m.name, m.price FROM order_items oi JOIN menu m ON oi.menu_id = m.id WHERE oi.order_id = ?");
                $stmtItems->execute([$order_id]);
                $order['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

                // Check if feedback exists for the order
                $stmtFeedback = $pdo->prepare("SELECT COUNT(*) FROM feedback WHERE order_id = ?");
                $stmtFeedback->execute([$order_id]);
                $order['feedbackExists'] = $stmtFeedback->fetchColumn() > 0;
            }

            // Fetch all reservations for the user
            $stmtRes = $pdo->prepare("SELECT table_number, reservation_time, status FROM reservations WHERE user_id = ? ORDER BY reservation_time DESC");
            $stmtRes->execute([$user_id]);
            $reservations = $stmtRes->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'orders' => $orders,
                'reservations' => $reservations
            ]);
        } catch (PDOException $e) {
            log_error('get_orders SQL error: ' . $e->getMessage());
            echo json_encode(['error' => 'Failed to fetch orders. SQL: ' . $e->getMessage()]);
        }
        exit;
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>