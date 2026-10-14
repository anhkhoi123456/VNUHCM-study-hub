(() => {
  const form = document.getElementById('loginForm');
  const password = document.getElementById('password');
  const status = document.getElementById('formStatus');
  const toggle = document.getElementById('togglePassword');
  let registering = false;
  toggle.addEventListener('click', () => {
    const visible = password.type === 'password';
    password.type = visible ? 'text' : 'password';
    toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    toggle.setAttribute('aria-pressed', String(visible));
  });
  document.getElementById('switchMode').addEventListener('click', () => {
    registering = !registering;
    document.getElementById('nameField').hidden = !registering;
    document.getElementById('name').required = registering;
    document.getElementById('switchPrompt').textContent = registering ? 'Already have an account?' : 'New to StudyHub?';
    document.getElementById('switchMode').textContent = registering ? 'SIGN IN' : 'SIGN UP';
    document.getElementById('formSubtitle').textContent = registering ? 'Register your account' : 'Log in to your account';
    document.getElementById('submitButton').textContent = registering ? 'Create account' : 'Login';
    password.autocomplete = registering ? 'new-password' : 'current-password';
    status.textContent = '';
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    status.textContent = registering ? 'Frontend preview: account creation is not connected yet.' : 'Frontend preview: login is not connected yet.';
  });
  document.getElementById('googleButton').addEventListener('click', () => {
    status.textContent = 'Google sign-in is not connected in this frontend preview.';
  });
})();
