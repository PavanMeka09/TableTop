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

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';
    // $csrf_token = $_POST['csrf_token'] ?? '';

    // if (!validate_csrf_token($csrf_token)) {
    //     echo json_encode(['error' => 'Invalid CSRF token.']);
    //     http_response_code(403);
    //     exit;
    // }

    if ($action === 'process_payment') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $order_id = intval($_POST['order_id'] ?? 0);
        $amount = floatval($_POST['amount'] ?? 0);
        $payment_method = $_POST['payment_method'] ?? '';

        if (!$order_id || !$amount || empty($payment_method)) {
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

        // TODO: Integrate Razorpay payment gateway here

        try {
            $stmt = $pdo->prepare("INSERT INTO payments (order_id, amount, payment_method, status) VALUES (?, ?, ?, ?)");
            $stmt->execute([$order_id, $amount, $payment_method, $payment_status]);

            // Update order status
            $stmt = $pdo->prepare("UPDATE orders SET status = 'delivered' WHERE id = ?");
            $stmt->execute([$order_id]);

            echo json_encode(['success' => 'Payment processed successfully.']);
        } catch (PDOException $e) {
            log_error($e->getMessage());
            echo json_encode(['error' => 'Failed to process payment.']);
        }
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>