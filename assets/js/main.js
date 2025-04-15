// Main functionality for login and registration

// User-friendly toast feedback
function showToast(msg, type = 'info') {
    let toast = document.createElement('div');
    toast.className = `fixed bottom-8 right-8 z-50 px-6 py-3 rounded shadow-lg text-white font-semibold ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-amber-600'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// Login function
async function login(email, password) {
    if (!email || !password) {
        showToast('Email and password are required.', 'error');
        return;
    }
    try {
        const response = await fetch('../backend/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'login', email, password })
        });
        const data = await response.json();
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast('Login successful!', 'success');
            sessionStorage.setItem('role', data.role);
            window.location.href = data.role === 'admin' ? '../pages/admin/dashboard.html' : '../index.html';
        }
    } catch (error) {
        showToast('Error during login.', 'error');
    }
}

// Register function
async function register(name, email, password) {
    if (!name || !email || !password) {
        showToast('All fields are required.', 'error');
        return;
    }
    try {
        const response = await fetch('../backend/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'register', name, email, password })
        });
        const data = await response.json();
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast('Registration successful! Please log in.', 'success');
            window.location.href = '../pages/login.html';
        }
    } catch (error) {
        showToast('Error during registration.', 'error');
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
            showToast('Logged out successfully!', 'success');
            sessionStorage.clear();
            window.location.href = '../index.html';
        }
    } catch (error) {
        showToast('Error during logout.', 'error');
    }
}

// Submit feedback
async function submitFeedback(message, rating) {
    if (!message || !rating) {
        showToast('Message and rating are required.', 'error');
        return;
    }
    try {
        const response = await fetch('../backend/feedback.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'create_feedback', message, rating })
        });
        const data = await response.json();
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast('Feedback submitted successfully!', 'success');
        }
    } catch (error) {
        showToast('Error submitting feedback.', 'error');
    }
}

// Example usage
// login('user@example.com', 'password123');
// register('John Doe', 'john@example.com', 'password123');
// logout();
// submitFeedback('Great service!', 5);