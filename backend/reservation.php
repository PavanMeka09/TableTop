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
        $table_number = intval($_POST['table_number'] ?? 0);
        $reservation_start = $_POST['reservation_start'] ?? '';
        $reservation_end = $_POST['reservation_end'] ?? '';

        if (!$table_number || empty($reservation_start) || empty($reservation_end)) {
            echo json_encode(['error' => 'Table number, reservation start, and reservation end are required.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM reservations WHERE table_number = ? AND status != 'cancelled' AND ((reservation_time < ? AND DATE_ADD(reservation_time, INTERVAL 1 HOUR) > ?) OR (reservation_time >= ? AND reservation_time < ?))");
        $stmt->execute([$table_number, $reservation_end, $reservation_start, $reservation_start, $reservation_end]);
        if ($stmt->fetchColumn() > 0) {
            echo json_encode(['error' => 'Table already booked for this time slot.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO reservations (user_id, table_number, reservation_time, reservation_end_time) VALUES (?, ?, ?, ?)");
            $stmt->execute([$user_id, $table_number, $reservation_start, $reservation_end]);
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
        $role = $_SESSION['role'] ?? 'user';
        $date = $_POST['date'] ?? null;
        $status = $_POST['status'] ?? null;

        try {
            if ($role === 'admin') {
                $query = "SELECT r.*, u.name as customer_name, u.email as customer_email FROM reservations r JOIN users u ON r.user_id = u.id WHERE 1=1";
                $params = [];
                if ($date && strtolower($date) !== 'all') {
                    $query .= " AND DATE(r.reservation_time) >= ?"; // Changed to include today and future dates
                    $params[] = $date;
                }
                if ($status && $status !== 'all') {
                    $query .= " AND r.status = ?";
                    $params[] = $status;
                }
                $query .= " ORDER BY r.reservation_time DESC";
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                // Regular user: only their reservations
                $query = "SELECT * FROM reservations WHERE user_id = ?";
                $params = [$user_id];
                if ($date && strtolower($date) !== 'all') {
                    $query .= " AND DATE(reservation_time) = ?";
                    $params[] = $date;
                }
                if ($status && $status !== 'all') {
                    $query .= " AND status = ?";
                    $params[] = $status;
                }
                $query .= " ORDER BY reservation_time DESC";
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            echo json_encode($reservations);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to get reservations.']);
        }
    } elseif ($action === 'get_booked_times') {
        $date = $_POST['date'] ?? null;
        if (!$date) {
            echo json_encode(['error' => 'Date is required.']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("SELECT table_number, TIME(reservation_time) as time FROM reservations WHERE DATE(reservation_time) = ? AND status != 'cancelled'");
            $stmt->execute([$date]);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $bookedTablesByTime = [];
            foreach ($bookings as $booking) {
                $time = $booking['time'];
                if (!isset($bookedTablesByTime[$time])) {
                    $bookedTablesByTime[$time] = [];
                }
                $bookedTablesByTime[$time][] = $booking['table_number'];
            }
            
            echo json_encode(['booked_tables_by_time' => $bookedTablesByTime]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to fetch booked times.']);
        }
    } elseif ($action === 'get_booked_tables') {
        $date = $_POST['date'] ?? null;
        $time = $_POST['time'] ?? null;
        if (!$date || !$time) {
            echo json_encode(['error' => 'Date and time are required.']);
            exit;
        }
        $datetime = $date . ' ' . $time . ':00';
        try {
            $stmt = $pdo->prepare("SELECT table_number FROM reservations WHERE reservation_time = ? AND status != 'cancelled'");
            $stmt->execute([$datetime]);
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo json_encode(['booked_tables' => $tables]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to fetch booked tables.']);
        }
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>