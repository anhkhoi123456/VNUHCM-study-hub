(() => {
  const form = document.getElementById('loginForm');
  const password = document.getElementById('password');
  const status = document.getElementById('formStatus');
  const toggle = document.getElementById('togglePassword');
  let registering = false;
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
  // --- Firebase sign-in. Without config or over file:// the original preview messages stay. ---
  const auth = window.StudyHubAuth;
  const live = Boolean(auth && auth.available);
  const googleButton = document.getElementById('googleButton');
  const submitButton = document.getElementById('submitButton');
  if (live) auth.preload(); // SDK must be ready before the click: signInWithPopup runs synchronously in it.
  const apiMessages = {
    email_domain_not_allowed: 'This email domain is not allowed to use StudyHub.',
    email_not_verified: 'Verify your email address first.',
    email_required: 'Your account has no email address.',
    email_in_use: 'This email already belongs to another account.',
    auth_not_configured: 'The StudyHub server is not set up for sign-in yet.',
    invalid_token: 'Your session could not be verified. Please try again.'
  };
  const firebaseMessages = {
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'Wrong email or password.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
    'auth/weak-password': 'Choose a stronger password.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/popup-blocked': 'The sign-in popup was blocked. Allow popups for this site and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled for the project.',
    'auth/unauthorized-domain': 'This address is not an authorized domain for sign-in. Use http://localhost:3000.'
  };
  const quiet = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);
  class SignInError extends Error {}
  function explain(error) {
    if (error instanceof SignInError) return error.message;
    if (error && quiet.has(error.code)) return '';
    return (error && firebaseMessages[error.code]) || 'Something went wrong. Please try again.';
  }
  async function run(task) {
    submitButton.disabled = googleButton.disabled = true;
    status.textContent = '';
    try { await task(); } catch (error) { status.textContent = explain(error); }
    finally { submitButton.disabled = googleButton.disabled = false; }
  }
  /** The backend is the gate: it checks the token, verified email and allowed domains. */
  async function finishSignIn(fbAuth) {
    const user = fbAuth.currentUser;
    if (!user.emailVerified) {
      await user.sendEmailVerification().catch(() => {});
      await fbAuth.signOut();
      throw new SignInError(`Your email is not verified yet. We sent a new verification link to ${user.email}.`);
    }
    let response;
    try {
      response = await fetch('/api/me', { headers: { Authorization: `Bearer ${await user.getIdToken()}`, Accept: 'application/json' } });
    } catch {
      await fbAuth.signOut();
      throw new SignInError('Cannot reach the StudyHub server.');
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      await fbAuth.signOut();
      throw new SignInError(apiMessages[body.code] || `Sign-in failed (${response.status}).`);
    }
    window.location.replace('dashboard.html');
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    setInspecting(false);
    if (!live) {
      status.textContent = registering ? 'Frontend preview: account creation is not connected yet.' : 'Frontend preview: login is not connected yet.';
      return;
    }
    const email = document.getElementById('email').value.trim();
    const name = document.getElementById('name').value.trim();
    run(async () => {
      const fbAuth = await auth.load();
      if (registering) {
        const { user } = await fbAuth.createUserWithEmailAndPassword(email, password.value);
        await user.updateProfile({ displayName: name }).catch(() => {});
        await user.sendEmailVerification();
        await fbAuth.signOut();
        password.value = '';
        document.getElementById('switchMode').click();
        status.textContent = `Account created. We sent a verification link to ${email}. Verify it, then log in.`;
      } else {
        await fbAuth.signInWithEmailAndPassword(email, password.value);
        await finishSignIn(fbAuth);
      }
    });
  });
  googleButton.addEventListener('click', () => {
    if (!live) {
      status.textContent = 'Google sign-in is not connected in this frontend preview.';
      return;
    }
    const fbAuth = auth.current();
    if (!fbAuth) { status.textContent = 'Sign-in is still loading. Try again in a moment.'; return; }
    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    // Called synchronously inside the click so the browser does not block the popup.
    run(() => fbAuth.signInWithPopup(provider).then(() => finishSignIn(fbAuth)));
  });
})();
