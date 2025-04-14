<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'register') {
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        if (empty($name) || empty($email) || empty($password)) {
            echo json_encode(['error' => 'All fields are required.']);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        try {
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
            $stmt->execute([$name, $email, $hashedPassword]);
            echo json_encode(['success' => 'User registered successfully.']);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Email already exists.']);
        }
    } elseif ($action === 'login') {
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        if (empty($email) || empty($password)) {
            echo json_encode(['error' => 'Email and password are required.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role'] = $user['role'];
            echo json_encode(['success' => 'Login successful.', 'role' => $user['role']]);
        } else {
            echo json_encode(['error' => 'Invalid email or password.']);
        }
    } elseif ($action === 'logout') {
        session_destroy();
        echo json_encode(['success' => 'Logged out successfully.']);
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>