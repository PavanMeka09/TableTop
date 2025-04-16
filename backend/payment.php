<?php
session_start();
require_once 'config.php';
require_once __DIR__ . '/../vendor/autoload.php'; // Razorpay SDK
use Razorpay\Api\Api;

header('Content-Type: application/json');

function log_error($msg) {
    error_log($msg, 3, __DIR__ . '/../error.log');
}

$razorpay_key_id = 'rzp_test_M0ttAHjE4Tsx3R'; // Replace with your Razorpay Test Key ID
$razorpay_key_secret = 'koUssWPtH2cXv4ItE0AnMlvh'; // Replace with your Razorpay Test Key Secret

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'create_razorpay_order') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }
        $items = json_decode($_POST['items'] ?? '[]', true);
        if (!is_array($items) || empty($items)) {
            echo json_encode(['error' => 'No items selected.']);
            exit;
        }
        // Calculate total amount
        $total = 0;
        foreach ($items as $item) {
            $menu_id = $item['menu_id'];
            $quantity = $item['quantity'];
            $stmt = $pdo->prepare('SELECT price FROM menu WHERE id = ?');
            $stmt->execute([$menu_id]);
            $menu_item = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$menu_item) {
                echo json_encode(['error' => 'Invalid menu item.']);
                exit;
            }
            $total += $menu_item['price'] * $quantity;
        }
        $amount = $total * 100; // Razorpay expects amount in paise
        try {
            $api = new Api($razorpay_key_id, $razorpay_key_secret);
            $razorpayOrder = $api->order->create([
                'amount' => $amount,
                'currency' => 'INR',
                'payment_capture' => 1
            ]);
            echo json_encode([
                'razorpay_order_id' => $razorpayOrder['id'],
                'amount' => $amount,
                'razorpay_key_id' => $razorpay_key_id
            ]);
        } catch (Exception $e) {
            log_error($e->getMessage());
            echo json_encode(['error' => 'Failed to create Razorpay order.']);
        }
        exit;
    } elseif ($action === 'verify_razorpay_payment') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }
        $razorpay_payment_id = $_POST['razorpay_payment_id'] ?? '';
        $razorpay_order_id = $_POST['razorpay_order_id'] ?? '';
        $razorpay_signature = $_POST['razorpay_signature'] ?? '';
        $items = json_decode($_POST['items'] ?? '[]', true);
        if (!$razorpay_payment_id || !$razorpay_order_id || !$razorpay_signature || empty($items)) {
            echo json_encode(['error' => 'Missing payment details.']);
            exit;
        }
        // Verify signature
        $generated_signature = hash_hmac('sha256', $razorpay_order_id . '|' . $razorpay_payment_id, $razorpay_key_secret);
        if ($generated_signature !== $razorpay_signature) {
            echo json_encode(['error' => 'Payment verification failed.']);
            exit;
        }
        // Place order in DB
        $user_id = $_SESSION['user_id'];
        $total_price = 0;
        try {
            $pdo->beginTransaction();
            foreach ($items as $item) {
                $menu_id = $item['menu_id'];
                $quantity = $item['quantity'];
                $stmt = $pdo->prepare('SELECT price FROM menu WHERE id = ?');
                $stmt->execute([$menu_id]);
                $menu_item = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$menu_item) {
                    log_error('Invalid menu item in payment.php verify_razorpay_payment: menu_id=' . $menu_id);
                    throw new Exception('Invalid menu item.');
                }
                $total_price += $menu_item['price'] * $quantity;
            }
            $stmt = $pdo->prepare('INSERT INTO orders (user_id, total_price) VALUES (?, ?)');
            $stmt->execute([$user_id, $total_price]);
            $order_id = $pdo->lastInsertId();
            foreach ($items as $item) {
                $menu_id = $item['menu_id'];
                $quantity = $item['quantity'];
                $stmt = $pdo->prepare('INSERT INTO order_items (order_id, menu_id, quantity) VALUES (?, ?, ?)');
                $stmt->execute([$order_id, $menu_id, $quantity]);
            }
            // Record payment
            $stmt = $pdo->prepare('INSERT INTO payments (order_id, amount, payment_method, status, razorpay_payment_id) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$order_id, $total_price, 'razorpay', 'completed', $razorpay_payment_id]);
            $pdo->commit();
            echo json_encode(['success' => true, 'order_id' => $order_id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            $errorMsg = 'Exception in payment.php verify_razorpay_payment: ' . $e->getMessage() . ' | user_id: ' . ($user_id ?? 'N/A') . ' | items: ' . json_encode($items);
            log_error($errorMsg);
            // In development, return the real error for debugging. Remove in production!
            $devMode = true; // Set to false in production
            if ($devMode) {
                echo json_encode(['error' => 'Failed to place order after payment. Details: ' . $e->getMessage()]);
            } else {
                echo json_encode(['error' => 'Failed to place order after payment.']);
            }
        }
        exit;
    } elseif ($action === 'process_payment') {
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