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

    if ($action === 'create_feedback') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $user_id = $_SESSION['user_id'];
        $message = htmlspecialchars(trim($_POST['message'] ?? ''));
        $rating = intval($_POST['rating'] ?? 0);

        if (empty($message) || $rating < 1 || $rating > 5) {
            echo json_encode(['error' => 'Message and valid rating required.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO feedback (user_id, message, rating) VALUES (?, ?, ?)");
            $stmt->execute([$user_id, $message, $rating]);
            echo json_encode(['success' => 'Feedback submitted successfully.']);
        } catch (PDOException $e) {
            log_error($e->getMessage());
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