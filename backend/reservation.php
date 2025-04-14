<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'create_reservation') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Unauthorized access.']);
            exit;
        }

        $user_id = $_SESSION['user_id'];
        $table_number = $_POST['table_number'] ?? '';
        $reservation_time = $_POST['reservation_time'] ?? '';

        if (empty($table_number) || empty($reservation_time)) {
            echo json_encode(['error' => 'Table number and reservation time are required.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO reservations (user_id, table_number, reservation_time) VALUES (?, ?, ?)");
            $stmt->execute([$user_id, $table_number, $reservation_time]);
            echo json_encode(['success' => 'Reservation created successfully.']);
        } catch (PDOException $e) {
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