<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// CSRF token generation and validation
// function generate_csrf_token() {
//     if (empty($_SESSION['csrf_token'])) {
//         $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
//     }
//     return $_SESSION['csrf_token'];
// }

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

    // Remove CSRF token validation
    // if (!in_array($action, ['send_otp', 'verify_otp', 'check_session', 'login', 'register', 'forgot_password', 'reset_password']) && !validate_csrf_token($csrf_token)) {
    //     echo json_encode(['error' => 'Invalid CSRF token.']);
    //     http_response_code(403);
    //     exit;
    // }

    if ($action === 'send_otp') {
        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        if (!$email) {
            echo json_encode(['error' => 'Valid email required.']);
            exit;
        }
        $otp = rand(1000, 9999);
        $_SESSION['otp'] = $otp;
        $_SESSION['otp_email'] = $email;
        // Send OTP to email
        $subject = 'Your TableTop OTP Code';
        $message = "Your OTP code is: $otp";
        $headers = 'From: noreply@tabletop.com' . "\r\n";
        if (mail($email, $subject, $message, $headers)) {
            echo json_encode(['success' => 'OTP sent to your email.']);
        } else {
            echo json_encode(['error' => 'Failed to send OTP.']);
        }
        exit;
    } elseif ($action === 'verify_otp') {
        $otp = $_POST['otp'] ?? '';
        if (empty($otp)) {
            echo json_encode(['error' => 'OTP is required.']);
            exit;
        }
        if (isset($_SESSION['otp']) && $otp == $_SESSION['otp']) {
            $_SESSION['otp_verified'] = true;
            echo json_encode(['success' => 'OTP verified.']);
        } else {
            echo json_encode(['error' => 'Invalid OTP.']);
        }
        exit;
    } elseif ($action === 'register') {
        $name = htmlspecialchars(trim($_POST['name'] ?? ''));
        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        $password = $_POST['password'] ?? '';
        $otp = $_POST['otp'] ?? '';

        if (!$name || !$email || !$password || !$otp) {
            echo json_encode(['error' => 'All fields are required.']);
            exit;
        }
        // Check OTP
        if (!isset($_SESSION['otp']) || !isset($_SESSION['otp_email']) || $_SESSION['otp_email'] !== $email || $otp != $_SESSION['otp']) {
            echo json_encode(['error' => 'OTP verification failed.']);
            exit;
        }
        unset($_SESSION['otp']);
        unset($_SESSION['otp_email']);
        unset($_SESSION['otp_verified']);
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        try {
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
            $stmt->execute([$name, $email, $hashedPassword]);
            echo json_encode(['success' => 'User registered successfully.']);
        } catch (PDOException $e) {
            log_error($e->getMessage());
            echo json_encode(['error' => 'Email already exists.']);
        }
        exit;
    } elseif ($action === 'login') {
        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        $password = $_POST['password'] ?? '';

        if (!$email || !$password) {
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
    } elseif ($action === 'check_session') {
        if (isset($_SESSION['user_id'])) {
            echo json_encode(['logged_in' => true, 'role' => $_SESSION['role']]);
        } else {
            echo json_encode(['logged_in' => false]);
        }
    } elseif ($action === 'forgot_password') {
        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        if (!$email) {
            echo json_encode(['error' => 'Valid email required.']);
            exit;
        }
        // Generate reset token and expiry
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour expiry
        try {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$user) {
                echo json_encode(['success' => 'Password reset link sent if email exists.']);
                exit;
            }
            $user_id = $user['id'];
            $stmt = $pdo->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token=?, expires_at=?");
            $stmt->execute([$user_id, $token, $expires, $token, $expires]);
            $reset_link = 'https://' . $_SERVER['HTTP_HOST'] . '/pages/login.html?reset_token=' . $token;
            $subject = 'TableTop Password Reset';
            $message = "Click the link to reset your password: $reset_link\nThis link expires in 1 hour.";
            $headers = 'From: noreply@tabletop.com' . "\r\n";
            mail($email, $subject, $message, $headers);
            echo json_encode(['success' => 'Password reset link sent if email exists.']);
        } catch (PDOException $e) {
            log_error($e->getMessage());
            echo json_encode(['error' => 'Failed to send reset link.']);
        }
        exit;
    } elseif ($action === 'reset_password') {
        $token = $_POST['token'] ?? '';
        $password = $_POST['password'] ?? '';
        if (!$token || !$password) {
            echo json_encode(['error' => 'Token and new password required.']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("SELECT user_id, expires_at FROM password_resets WHERE token = ?");
            $stmt->execute([$token]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row || strtotime($row['expires_at']) < time()) {
                echo json_encode(['error' => 'Invalid or expired token.']);
                exit;
            }
            $user_id = $row['user_id'];
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$hashedPassword, $user_id]);
            $stmt = $pdo->prepare("DELETE FROM password_resets WHERE user_id = ?");
            $stmt->execute([$user_id]);
            echo json_encode(['success' => 'Password reset successful.']);
        } catch (PDOException $e) {
            log_error($e->getMessage());
            echo json_encode(['error' => 'Failed to reset password.']);
        }
        exit;
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>