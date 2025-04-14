// Main functionality for login and registration

// Login function
async function login(email, password) {
    try {
        const response = await fetch('../backend/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'login', email, password })
        });
        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            alert('Login successful!');
            sessionStorage.setItem('role', data.role);
            window.location.href = data.role === 'admin' ? '../pages/admin/dashboard.html' : '../index.html';
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
}

// Register function
async function register(name, email, password) {
    try {
        const response = await fetch('../backend/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'register', name, email, password })
        });
        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            alert('Registration successful! Please log in.');
            window.location.href = '../pages/login.html';
        }
    } catch (error) {
        console.error('Error during registration:', error);
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('../backend/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'logout' })
        });
        const data = await response.json();
        if (data.success) {
            alert('Logged out successfully!');
            sessionStorage.clear();
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// Submit feedback
async function submitFeedback(message, rating) {
    try {
        const response = await fetch('../backend/feedback.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'create_feedback', message, rating })
        });
        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            alert('Feedback submitted successfully!');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
    }
}

// Example usage
// login('user@example.com', 'password123');
// register('John Doe', 'john@example.com', 'password123');
// logout();
// submitFeedback('Great service!', 5);