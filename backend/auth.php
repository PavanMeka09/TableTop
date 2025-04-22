<?php
session_start();
require_once 'config.php';
require_once __DIR__ . '/../vendor/autoload.php'; // PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

function log_error($msg) {
    error_log($msg, 3, __DIR__ . '/../error.log');
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'send_otp') {
        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        if (!$email) {
            echo json_encode(['error' => 'Valid email required.']);
            exit;
        }
        $otp = rand(1000, 9999);
        $_SESSION['otp'] = $otp;
        $_SESSION['otp_email'] = $email;
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'tabletoplpu@gmail.com';
            $mail->Password = 'bitm hgxp lhiz aybw';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;
            $mail->setFrom('tabletoplpu@gmail.com', 'TableTop');
            $mail->addAddress($email);
            $mail->Subject = 'TableTop OTP';
            $mail->Body = "Your OTP is: $otp";
            $mail->send();
            echo json_encode(['success' => 'OTP sent to your email.']);
        } catch (Exception $e) {
            log_error('PHPMailer error (OTP): ' . $mail->ErrorInfo);
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
        if (strlen($password) < 6) {
            echo json_encode(['error' => 'Password must be at least 6 characters long.']);
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
    } else {
        echo json_encode(['error' => 'Invalid action.']);
    }
} else {
    echo json_encode(['error' => 'Invalid request method.']);
}
?>