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

    if ($action === 'create_reservation') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $user_id = $_SESSION['user_id'];
        $table_number = intval($_POST['table_number'] ?? 0);
        $reservation_time = $_POST['reservation_time'] ?? '';

        if (!$table_number || empty($reservation_time)) {
            echo json_encode(['error' => 'Table number and reservation time are required.']);
            exit;
        }

        // Real-time check for overlapping reservation
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM reservations WHERE table_number = ? AND reservation_time = ? AND status != 'cancelled'");
        $stmt->execute([$table_number, $reservation_time]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['error' => 'Table already booked for this time.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO reservations (user_id, table_number, reservation_time) VALUES (?, ?, ?)");
            $stmt->execute([$user_id, $table_number, $reservation_time]);
            echo json_encode(['success' => 'Reservation created successfully.']);
        } catch (PDOException $e) {
            log_error($e->getMessage());
            echo json_encode(['error' => 'Failed to create reservation.']);
        }
    } elseif ($action === 'update_status') {
        if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $reservation_id = $_POST['reservation_id'] ?? '';
        $status = $_POST['status'] ?? '';

        if (empty($reservation_id) || empty($status)) {
            echo json_encode(['error' => 'Reservation ID and status are required.']);
            exit;
        }

        $allowed_statuses = ['pending', 'confirmed', 'cancelled'];
        if (!in_array($status, $allowed_statuses)) {
            echo json_encode(['error' => 'Invalid status.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE reservations SET status = ? WHERE id = ?");
            $stmt->execute([$status, $reservation_id]);
            echo json_encode(['success' => 'Reservation status updated successfully.']);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to update reservation status.']);
        }
    } elseif ($action === 'get_reservations') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $user_id = $_SESSION['user_id'];

        try {
            $stmt = $pdo->prepare("SELECT * FROM reservations WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($reservations);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to get reservations.']);
        }
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>