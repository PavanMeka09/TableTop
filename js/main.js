async function login(email, password) {
    if (!email || !password) {
        console.error('Email and password are required.');
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
            console.error(data.error);
        } else {
            console.log('Login successful!');
            sessionStorage.setItem('role', data.role);
            window.location.href = data.role === 'admin' ? '../pages/admin/dashboard.html' : '../index.html';
        }
    } catch (error) {
        console.error('Error during login.');
    }
}

function loginUser(credentials) {
    const feedbackElement = document.getElementById('feedbackMessage');
    feedbackElement.textContent = 'Logging in...';
    feedbackElement.className = 'text-blue-600';

    fetch('/backend/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                feedbackElement.textContent = 'Login successful!';
                feedbackElement.className = 'text-green-600';
            } else {
                feedbackElement.textContent = response.error || 'Failed to log in';
                feedbackElement.className = 'text-red-600';
            }
        })
        .catch(() => {
            feedbackElement.textContent = 'Error logging in.';
            feedbackElement.className = 'text-red-600';
        });
}

// Register function
async function register(name, email, password) {
    if (!name || !email || !password) {
        console.error('All fields are required.');
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
            console.error(data.error);
        } else {
            console.log('Registration successful! Please log in.');
            window.location.href = '../pages/login.html';
        }
    } catch (error) {
        console.error('Error during registration.');
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
            console.log('Logged out successfully!');
            sessionStorage.clear();
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error during logout.');
    }
}

// Submit feedback
async function submitFeedback(message, rating) {
    if (!message || !rating) {
        console.error('Message and rating are required.');
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
            console.error(data.error);
        } else {
            console.log('Feedback submitted successfully!');
        }
    } catch (error) {
        console.error('Error submitting feedback.');
    }
}

// Main authentication and UI management
async function updateAuthUI() {
    const nav = document.querySelector('nav .flex.items-center.space-x-4');
    const loginBtn = nav.querySelector('.login-btn');
    const logoutBtn = nav.querySelector('.logout-btn');

    try {
        const res = await fetch('/backend/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'check_session' })
        });
        const data = await res.json();

        if (data.logged_in) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (!logoutBtn) {
                const logout = document.createElement('a');
                logout.textContent = 'Logout';
                logout.href = '#';
                logout.className = 'bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md logout-btn';
                logout.onclick = handleLogout;
                nav.appendChild(logout);
            }
            // Handle admin redirect if on protected pages
            if (window.location.pathname.includes('/admin/') && data.role !== 'admin') {
                window.location.href = '/index.html';
            }
        } else {
            if (loginBtn) loginBtn.style.display = '';
            if (logoutBtn) logoutBtn.remove();
            // Redirect if on protected pages
            if (window.location.pathname.includes('/admin/')) {
                window.location.href = '/pages/login.html';
            }
        }
    } catch (e) {
        console.error('Auth check failed:', e);
        if (loginBtn) loginBtn.style.display = '';
        if (logoutBtn) logoutBtn.remove();
    }
}

async function handleLogout(e) {
    e?.preventDefault();
    try {
        await fetch('/backend/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'logout' })
        });
        window.location.href = '/index.html';
    } catch (e) {
        console.error('Logout failed:', e);
    }
}

// Initialize auth UI when DOM loads
document.addEventListener('DOMContentLoaded', updateAuthUI);

// Example usage
// login('user@example.com', 'password123');
// register('John Doe', 'john@example.com', 'password123');
// logout();
// submitFeedback('Great service!', 5);