(() => {
  const form = document.getElementById('loginForm');
  const password = document.getElementById('password');
  const status = document.getElementById('formStatus');
  const toggle = document.getElementById('togglePassword');
  let registering = false;
  let role = 'student';
  document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => {
    role = button.dataset.role;
    document.querySelectorAll('[data-role]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.getElementById('submitButton').textContent = role === 'admin' ? 'Sign in as Admin' : 'Login';
    status.textContent = role === 'admin' ? 'Admin demo: upload and delete documents on course pages.' : '';
  }));
  let inspecting = false;
  let hoveringPassword = false;
  const wrap = password.closest('.password-wrap');
  const mirror = document.createElement('div');
  mirror.className = 'password-dot-mirror'; mirror.setAttribute('aria-hidden', 'true');
  const dots = document.createElement('span'); mirror.appendChild(dots);
  const lens = document.createElement('div');
  lens.className = 'password-reveal-lens'; lens.setAttribute('aria-hidden', 'true');
  const reveal = document.createElement('span'); lens.appendChild(reveal);
  const ring = document.createElement('div'); ring.className = 'password-lens-ring'; ring.setAttribute('aria-hidden', 'true');
  wrap.append(mirror, lens, ring);
  let lensX = 0, lensY = 0;
  function updatePasswordPreview() {
    password.type = 'password';
    wrap.classList.toggle('is-inspecting', inspecting && Boolean(password.value));
    const visible = inspecting && hoveringPassword && Boolean(password.value);
    wrap.classList.toggle('lens-visible', visible);
    dots.textContent = inspecting ? '•'.repeat(Array.from(password.value).length) : '';
    reveal.textContent = visible ? password.value : '';
    dots.style.transform = `translateX(${-password.scrollLeft}px)`;
    reveal.style.transform = `translateX(${-password.scrollLeft}px)`;
    lens.style.clipPath = `circle(27px at ${lensX}px ${lensY}px)`;
    ring.style.left = `${lensX}px`; ring.style.top = `${lensY}px`;
  }
  function setInspecting(enabled) {
    inspecting = enabled;
    document.documentElement.classList.toggle('password-inspection', enabled);
    toggle.setAttribute('aria-label', enabled ? 'Stop password inspection' : 'Inspect password on hover');
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.title = enabled ? 'Hover over the password to reveal it. Escape to exit.' : 'Inspect password on hover';
    updatePasswordPreview();
  }
  toggle.addEventListener('click', () => {
    setInspecting(!inspecting);
  });
  password.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const rect = wrap.getBoundingClientRect();
    lensX = event.clientX - rect.left; lensY = event.clientY - rect.top;
    const textEnd = 12 + Array.from(password.value).length * 9 - password.scrollLeft;
    hoveringPassword = lensX >= 12 && lensX <= Math.min(rect.width - 46, textEnd + 10);
    updatePasswordPreview();
  });
  password.addEventListener('pointerleave', () => { hoveringPassword = false; updatePasswordPreview(); });
  password.addEventListener('input', updatePasswordPreview);
  password.addEventListener('scroll', updatePasswordPreview);
  password.addEventListener('blur', () => { hoveringPassword = false; updatePasswordPreview(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setInspecting(false); });
  window.addEventListener('blur', () => { hoveringPassword = false; setInspecting(false); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { hoveringPassword = false; setInspecting(false); } });
  setInspecting(false);
  document.getElementById('switchMode').addEventListener('click', () => {
    registering = !registering;
    role = 'student';
    document.getElementById('roleOptions').hidden = registering;
    document.querySelectorAll('[data-role]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.role === 'student')));
    setInspecting(false);
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
    setInspecting(false);
    if (registering) {
      status.textContent = 'Frontend preview: account creation is not connected yet.';
      return;
    }
    try {
      sessionStorage.setItem('studyhub-session', JSON.stringify({ role }));
      location.assign(role === 'admin' ? 'dsa.html' : 'dashboard.html');
    } catch { status.textContent = 'Browser session storage is unavailable. Enable storage to sign in.'; }
  });
  document.getElementById('googleButton').addEventListener('click', () => {
    status.textContent = 'Google sign-in is not connected in this frontend preview.';
  });
})();
