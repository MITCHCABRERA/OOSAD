// main.js - handles registration, login, and routing

// helper: load users from localStorage
function loadUsers() {
  return JSON.parse(localStorage.getItem('ph_users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('ph_users', JSON.stringify(users));
}

// pre-seed two accounts if none exist
(function seed() {
  const users = loadUsers();
  if (users.length === 0) {
    users.push({
      id: 1,
      name: 'Demo Owner',
      email: 'user@example.com',
      password: 'password',
      role: 'owner'
    });
    users.push({
      id: 2,
      name: 'Demo Vet',
      email: 'vet@example.com',
      password: 'vetpass',
      role: 'vet'
    });
    saveUsers(users);
  }
})();

// UI bindings
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showLoginBtn = document.getElementById('show-login');
const showRegisterBtn = document.getElementById('show-register');

// Toggle between forms
showRegisterBtn.addEventListener('click', () => {
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
});

showLoginBtn.addEventListener('click', () => {
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
});

// Register
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;

  const users = loadUsers();
  if (users.find((u) => u.email === email)) {
    alert('Email already registered');
    return;
  }

  const id = Date.now();
  users.push({ id, name, email, password, role });
  saveUsers(users);
  alert('Registration successful — you can now log in');
  registerForm.reset();
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
});

// Login
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const role = document.getElementById('login-role').value;

  const users = loadUsers();
  const user = users.find((u) => u.email === email && u.password === password && u.role === role);

  if (!user) {
    alert('Invalid credentials or role');
    return;
  }

  // save current session
  localStorage.setItem('ph_session', JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  }));

  // redirect based on role
  if (user.role === 'owner') {
    window.location.href = 'dashboard.html';
  } else if (user.role === 'vet') {
    window.location.href = 'vet-dashboard.html';
  }
});
