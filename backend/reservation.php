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
        $role = $_SESSION['role'] ?? 'user';
        $date = $_POST['date'] ?? null;
        $status = $_POST['status'] ?? null;

        // Debugging: Log session and query parameters
        log_error("Session: " . json_encode($_SESSION));
        log_error("Query Parameters: Date=" . $date . ", Status=" . $status);

        try {
            if ($role === 'admin') {
                // Admin: get all reservations, optionally filter by date and status
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
                log_error("SQL Query: " . $query . " | Params: " . json_encode($params));
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
                log_error("SQL Query: " . $query . " | Params: " . json_encode($params));
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            echo json_encode($reservations);
        } catch (PDOException $e) {
            log_error("Database Error: " . $e->getMessage());
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
            
            // Group bookings by time slot
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
        // Get all booked tables for a given date and time (returns array of table numbers)
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