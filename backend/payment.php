<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'process_payment') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $order_id = $_POST['order_id'] ?? '';
        $amount = $_POST['amount'] ?? '';
        $payment_method = $_POST['payment_method'] ?? '';

        if (empty($order_id) || empty($amount) || empty($payment_method)) {
            echo json_encode(['error' => 'Order ID, amount, and payment method are required.']);
            exit;
        }

        $allowed_payment_methods = ['card', 'cash', 'online'];
        if (!in_array($payment_method, $allowed_payment_methods)) {
            echo json_encode(['error' => 'Invalid payment method.']);
            exit;
        }

        // Simulate payment processing
        $payment_status = 'completed'; // Assume payment is successful

        try {
            $stmt = $pdo->prepare("INSERT INTO payments (order_id, amount, payment_method, status) VALUES (?, ?, ?, ?)");
            $stmt->execute([$order_id, $amount, $payment_method, $payment_status]);

            // Update order status
            $stmt = $pdo->prepare("UPDATE orders SET status = 'delivered' WHERE id = ?");
            $stmt->execute([$order_id]);

            echo json_encode(['success' => 'Payment processed successfully.']);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to process payment.']);
        }
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>