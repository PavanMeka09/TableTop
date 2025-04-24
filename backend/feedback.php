<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'create_feedback') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $user_id = $_SESSION['user_id'];
        $message = htmlspecialchars(trim($_POST['message'] ?? ''));
        $rating = intval($_POST['rating'] ?? 0);
        $order_id = intval($_POST['order_id'] ?? 0);

        if ($rating < 1 || $rating > 5) {
            echo json_encode(['error' => 'Valid rating required.']);
            exit;
        }

        if ($order_id <= 0) {
            echo json_encode(['error' => 'Invalid order ID.']);
            exit;
        }

        try {
            // Validate order_id exists in the orders table
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE id = ?");
            $stmt->execute([$order_id]);
            $orderExists = $stmt->fetchColumn();

            if (!$orderExists) {
                echo json_encode(['error' => 'Order ID does not exist.']);
                exit;
            }

            $stmt = $pdo->prepare("SELECT COUNT(*) FROM feedback WHERE user_id = ? AND order_id = ?");
            $stmt->execute([$user_id, $order_id]);
            $feedbackExists = $stmt->fetchColumn();

            if ($feedbackExists) {
                echo json_encode(['error' => 'Feedback already submitted for this order.']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO feedback (user_id, order_id, message, rating) VALUES (?, ?, ?, ?)");
            $stmt->execute([$user_id, $order_id, $message, $rating]);
            echo json_encode(['success' => 'Feedback submitted successfully.']);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to submit feedback.', 'debug' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} elseif ($method === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'check_feedback_status') {
        $order_id = intval($_GET['order_id'] ?? 0);

        if ($order_id <= 0) {
            echo json_encode(['error' => 'Invalid order ID.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM feedback WHERE order_id = ?");
            $stmt->execute([$order_id]);
            $feedbackExists = $stmt->fetchColumn();

            echo json_encode(['feedbackGiven' => $feedbackExists > 0]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to check feedback status.']);
        }
    } elseif ($action === 'get_feedback_status') {
        $order_id = intval($_GET['order_id'] ?? 0);

        if ($order_id <= 0) {
            echo json_encode(['error' => 'Invalid order ID.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM feedback WHERE order_id = ?");
            $stmt->execute([$order_id]);
            $feedbackExists = $stmt->fetchColumn();

            echo json_encode(['feedbackExists' => $feedbackExists > 0]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to check feedback status.']);
        }
    } elseif ($action === 'get_feedback') {
        if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        try {
            $stmt = $pdo->query("SELECT feedback.id, users.name, users.email, feedback.message, feedback.rating, feedback.response, feedback.created_at, feedback.order_id FROM feedback JOIN users ON feedback.user_id = users.id");
            $feedback = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($feedback);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to fetch feedback.']);
        }
    } else {
        if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        try {
            $stmt = $pdo->query("SELECT * FROM feedback");
            $feedback = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($feedback);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to get feedback.']);
        }
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>