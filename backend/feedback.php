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
        $message = $_POST['message'] ?? '';
        $rating = $_POST['rating'] ?? '';

        if (empty($message) || empty($rating)) {
            echo json_encode(['error' => 'Message and rating are required.']);
            exit;
        }

        if ($rating < 1 || $rating > 5) {
            echo json_encode(['error' => 'Rating must be between 1 and 5.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO feedback (user_id, message, rating) VALUES (?, ?, ?)");
            $stmt->execute([$user_id, $message, $rating]);
            echo json_encode(['success' => 'Feedback submitted successfully.']);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to submit feedback.']);
        }
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} elseif ($method === 'GET') {
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
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>