const STORAGE_KEY = 'sunSonSolarAccounts';
const SESSION_KEY = 'currentUser';

const views = {
  registration: document.getElementById('registrationView'),
  login: document.getElementById('loginView'),
  dashboard: document.getElementById('dashboardView')
};

const registrationForm = document.getElementById('registrationForm');
const loginForm = document.getElementById('loginForm');
const registrationNotice = document.getElementById('registrationNotice');
const loginNotice = document.getElementById('loginNotice');
const logoutBtn = document.getElementById('logoutBtn');

const _ = (selector) => document.querySelector(selector);

function getAccounts() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function showView(viewName) {
  Object.entries(views).forEach(([key, view]) => {
    view.classList.toggle('active', key === viewName);
  });
}

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = 'form-message';
  if (type) {
    element.classList.add(type);
  }
  element.hidden = false;
}

function clearMessage(element) {
  element.textContent = '';
  element.className = 'form-message';
  element.hidden = true;
}

function fieldError(input, message) {
  const field = input.closest('.field');
  const errorEl = field ? field.querySelector('.error-text') : null;

  const hasError = Boolean(message);
  input.setAttribute('aria-invalid', hasError ? 'true' : 'false');
  input.classList.toggle('invalid', hasError);

  if (errorEl) {
    errorEl.textContent = message || '';
  }
}

function validateName(value, label) {
  if (!value.trim()) {
    return `Please enter your ${label.toLowerCase()}.`;
  }

  if (!/^[A-Za-z\s'-]+$/.test(value.trim())) {
    return `Please enter a valid ${label.toLowerCase()}.`;
  }

  return '';
}

function validatePhone(value) {
  if (!value.trim()) {
    return 'Please enter your phone number.';
  }

  const normalized = value.trim();
  const philippinePattern = /^(?:\+63\d{10}|09\d{9})$/;

  if (!philippinePattern.test(normalized)) {
    return 'Please enter a valid Philippine phone number.';
  }

  return '';
}

function validateUsername(value, isLogin = false) {
  const trimmed = value.trim();

  if (!trimmed) {
    return isLogin ? 'Please enter your username.' : 'Please enter a username.';
  }

  if (trimmed.length < 4 || trimmed.length > 30) {
    return 'Username must be between 4 and 30 characters.';
  }

  if (/\s/.test(trimmed)) {
    return 'Username can only contain letters, numbers, underscores, and periods.';
  }

  if (!/^[A-Za-z0-9_.]+$/.test(trimmed)) {
    return 'Username can only contain letters, numbers, underscores, and periods.';
  }

  return '';
}

function validatePassword(value) {
  if (!value) {
    return 'Please enter your password.';
  }

  if (value.length < 8 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Password must be at least 8 characters and contain a number.';
  }

  return '';
}

function validateBirthdate(value) {
  if (!value) {
    return 'Please select your birthdate.';
  }

  const selectedDate = new Date(value + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate > today) {
    return 'Birthdate cannot be in the future.';
  }

  return '';
}

function validateGender(value) {
  if (!value) {
    return 'Please select your gender.';
  }

  return '';
}

function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return 'Please confirm your password.';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return '';
}

function populateDashboard() {
  const currentUser = sessionStorage.getItem(SESSION_KEY);
  if (!currentUser) return;

  const account = getAccounts().find((item) => item.username === currentUser);
  if (!account) {
    sessionStorage.removeItem(SESSION_KEY);
    showView('login');
    return;
  }

  const fullName = [account.firstName, account.middleName, account.lastName].filter(Boolean).join(' ');
  document.getElementById('dashboardName').textContent = account.firstName || account.username;
  document.getElementById('dashboardFullName').textContent = fullName;
  document.getElementById('dashboardUsername').textContent = account.username;
  document.getElementById('dashboardPhone').textContent = account.phone;
  document.getElementById('dashboardGender').textContent = account.gender;
  showView('dashboard');
}

function handleRegistrationSubmit(event) {
  event.preventDefault();
  clearMessage(registrationNotice);

  const fields = {
    firstName: document.getElementById('firstName'),
    middleName: document.getElementById('middleName'),
    lastName: document.getElementById('lastName'),
    birthdate: document.getElementById('birthdate'),
    gender: document.getElementById('gender'),
    phone: document.getElementById('phone'),
    username: document.getElementById('regUsername'),
    password: document.getElementById('regPassword'),
    confirmPassword: document.getElementById('confirmPassword')
  };

  const errors = {
    firstName: validateName(fields.firstName.value, 'First Name'),
    lastName: validateName(fields.lastName.value, 'Last Name'),
    birthdate: validateBirthdate(fields.birthdate.value),
    gender: validateGender(fields.gender.value),
    phone: validatePhone(fields.phone.value),
    username: validateUsername(fields.username.value),
    password: validatePassword(fields.password.value),
    confirmPassword: validateConfirmPassword(fields.password.value, fields.confirmPassword.value)
  };

  Object.entries(fields).forEach(([key, input]) => {
    if (key === 'middleName') {
      fieldError(input, '');
      return;
    }

    fieldError(input, errors[key] || '');
  });

  const firstInvalid = Object.values(fields).find((input) => {
    if (input.id === 'middleName') return false;
    return input.getAttribute('aria-invalid') === 'true';
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const accounts = getAccounts();
  const username = fields.username.value.trim();
  if (accounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
    fieldError(fields.username, 'This username is already registered.\nPlease choose another username.');
    fields.username.focus();
    showMessage(registrationNotice, 'This username is already registered. Please choose another username.', 'error');
    return;
  }

  const newAccount = {
    firstName: fields.firstName.value.trim(),
    middleName: fields.middleName.value.trim(),
    lastName: fields.lastName.value.trim(),
    birthdate: fields.birthdate.value,
    gender: fields.gender.value,
    phone: fields.phone.value.trim(),
    username: username,
    password: fields.password.value
  };

  accounts.push(newAccount);
  saveAccounts(accounts);

  showMessage(registrationNotice, 'Account created successfully! You can now log in.', 'success');
  registrationForm.reset();
  clearErrors();

  setTimeout(() => {
    document.getElementById('loginUsername').value = username;
    showView('login');
    clearMessage(registrationNotice);
  }, 900);
}

function clearErrors() {
  document.querySelectorAll('.field input, .field select').forEach((element) => {
    element.setAttribute('aria-invalid', 'false');
    element.classList.remove('invalid');
    const error = element.closest('.field')?.querySelector('.error-text');
    if (error) error.textContent = '';
  });
}

function handleLoginSubmit(event) {
  event.preventDefault();
  clearMessage(loginNotice);

  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');

  const usernameError = validateUsername(usernameInput.value, true);
  const passwordError = validatePassword(passwordInput.value);

  fieldError(usernameInput, usernameError);
  fieldError(passwordInput, passwordError);

  if (usernameError || passwordError) {
    const firstInvalid = usernameError ? usernameInput : passwordInput;
    firstInvalid.focus();
    return;
  }

  const accounts = getAccounts();
  const foundAccount = accounts.find((account) => account.username.toLowerCase() === usernameInput.value.trim().toLowerCase());

  if (!foundAccount) {
    fieldError(usernameInput, 'Account not found. Please check your username or register for an account.');
    showMessage(loginNotice, 'Account not found. Please check your username or register for an account.', 'error');
    usernameInput.focus();
    return;
  }

  if (foundAccount.password !== passwordInput.value) {
    fieldError(passwordInput, 'Incorrect password. Please check your password and try again.');
    showMessage(loginNotice, 'Incorrect password. Please check your password and try again.', 'error');
    passwordInput.focus();
    return;
  }

  sessionStorage.setItem(SESSION_KEY, foundAccount.username);
  showMessage(loginNotice, `Login successful! Welcome back, ${foundAccount.firstName}!`, 'success');
  loginForm.reset();
  clearErrors();
  populateDashboard();
}

function setupToggleButtons() {
  document.querySelectorAll('.toggle-password').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;

      const shouldShow = input.type === 'password';
      input.type = shouldShow ? 'text' : 'password';
      button.textContent = shouldShow ? '🙈' : '👁';
      button.setAttribute('aria-label', shouldShow ? 'Hide password' : 'Show password');
    });
  });
}

function setupViewSwitches() {
  document.querySelectorAll('[data-view]').forEach((link) => {
    link.addEventListener('click', () => {
      const target = link.getAttribute('data-view');
      if (target === 'login') {
        clearMessage(registrationNotice);
        showView('login');
      }

      if (target === 'registration') {
        clearMessage(loginNotice);
        showView('registration');
      }
    });
  });
}

function attachInputValidation() {
  const registrationInputs = [
    document.getElementById('firstName'),
    document.getElementById('lastName'),
    document.getElementById('birthdate'),
    document.getElementById('gender'),
    document.getElementById('phone'),
    document.getElementById('regUsername'),
    document.getElementById('regPassword'),
    document.getElementById('confirmPassword')
  ];

  registrationInputs.forEach((input) => {
    input.addEventListener('input', () => {
      if (input.id === 'middleName') {
        fieldError(input, '');
        return;
      }

      if (!input.value) {
        fieldError(input, '');
        return;
      }

      if (input.id === 'firstName') {
        fieldError(input, validateName(input.value, 'First Name'));
      }

      if (input.id === 'lastName') {
        fieldError(input, validateName(input.value, 'Last Name'));
      }

      if (input.id === 'birthdate') {
        fieldError(input, validateBirthdate(input.value));
      }

      if (input.id === 'gender') {
        fieldError(input, validateGender(input.value));
      }

      if (input.id === 'phone') {
        fieldError(input, validatePhone(input.value));
      }

      if (input.id === 'regUsername') {
        fieldError(input, validateUsername(input.value));
      }

      if (input.id === 'regPassword') {
        fieldError(input, validatePassword(input.value));
      }

      if (input.id === 'confirmPassword') {
        fieldError(input, validateConfirmPassword(document.getElementById('regPassword').value, input.value));
      }
    });
  });

  document.getElementById('loginUsername').addEventListener('input', () => {
    const value = document.getElementById('loginUsername').value;
    if (!value) {
      fieldError(document.getElementById('loginUsername'), '');
      return;
    }
    fieldError(document.getElementById('loginUsername'), validateUsername(value, true));
  });

  document.getElementById('loginPassword').addEventListener('input', () => {
    const value = document.getElementById('loginPassword').value;
    if (!value) {
      fieldError(document.getElementById('loginPassword'), '');
      return;
    }
    fieldError(document.getElementById('loginPassword'), validatePassword(value));
  });
}

function initDefaultState() {
  const currentUser = sessionStorage.getItem(SESSION_KEY);
  if (currentUser) {
    populateDashboard();
  } else {
    showView('registration');
  }
}

registrationForm.addEventListener('submit', handleRegistrationSubmit);
loginForm.addEventListener('submit', handleLoginSubmit);
logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('loginPassword').value = '';
  clearErrors();
  clearMessage(loginNotice);
  showView('login');
});

setupToggleButtons();
setupViewSwitches();
attachInputValidation();
initDefaultState();
