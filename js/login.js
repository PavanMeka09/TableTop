function showSignup() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
}
function showLogin() {
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
}
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector('i');
  if(input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
      input.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}
async function sendOTP() {
  const email = document.getElementById('signupEmail').value.trim();
  if (!email) { alert('Please enter your email.'); return; }
  document.getElementById('sendOtpBtn').innerHTML = '<i class="fas fa-sync-alt animate-spin"></i>';
  const res = await fetch('http://localhost/tabletop/backend/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'send_otp', email })
  });
  const data = await res.json();
  document.getElementById('sendOtpBtn').innerHTML = 'Send OTP';
  if (data.success) {
      alert('OTP sent to your email.');
      document.getElementById('otpInput').value = '';
      document.getElementById('otpInput').focus();
  } else {
      alert(data.error || 'Failed to send OTP.');
  }
}
function onOtpInput() {
  const otp = document.getElementById('otpInput').value;
  if (otp.length === 4) {
      document.getElementById('verifyOtpBtn').focus();
  }
}
async function verifyOTP() {
  const otp = document.getElementById('otpInput').value;
  const email = document.getElementById('signupEmail').value.trim();
  if (!/^[0-9]{4}$/.test(otp)) { alert('Enter a valid 4-digit OTP.'); return; }
  const res = await fetch('http://localhost/tabletop/backend/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'verify_otp', otp, email })
  });
  const data = await res.json();
  if (data.success) {
      alert('OTP verified!');
      document.getElementById('passwordSection').classList.remove('hidden');
      document.getElementById('signupPassword').value = '';
      document.getElementById('signupPassword').focus();
      window.otpVerified = true;
  } else {
      alert(data.error || 'Invalid OTP.');
  }
}
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
  }
  try {
      const response = await fetch('http://localhost/tabletop/backend/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ action: 'login', email, password })
      });
      const data = await response.json();
      if (data.error) {
          alert(data.error);
      } else {
          window.location.href = data.role === 'admin' ? '../pages/admin/dashboard.html' : '../index.html';
      }
  } catch (error) {
      console.error('Error during login:', error);
  }
}
async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const otp = document.getElementById('otpInput').value;
  if (!name || !email || !otp) { alert('Name, Email, and OTP are required.'); return; }
  if (!window.otpVerified) { alert('Please verify OTP before setting password.'); return; }
  if (!password) { alert('Please enter a password.'); return; }
  if (password.length < 6) { alert('Password must be at least 6 characters long.'); return; }
  const response = await fetch('http://localhost/tabletop/backend/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'register', name, email, password, otp })
  });
  const data = await response.json();
  if (data.error) {
      alert(data.error);
  } else {
      alert('Account created successfully! Please log in.');
      showLogin();
  }
}