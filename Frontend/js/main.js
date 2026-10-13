/**
 * VNU - StudyHub | Shared JavaScript
 * Utility functions used across all pages
 */

// Load the shared theme after page-specific styles so every page uses the same palette.
(() => {
  let theme = 'light';
  try { if (localStorage.getItem('studyhub-theme') === 'dark') theme = 'dark'; } catch { /* Use light mode. */ }
  document.documentElement.dataset.theme = theme;
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'css/theme.css';
  document.head.appendChild(stylesheet);
})();

function initThemeToggle() {
  const actions = document.querySelector('.topbar-actions');
  if (!actions) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'topbar-icon-btn theme-toggle';
  button.innerHTML = '<svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><defs><mask id="themeMoonMask"><rect width="24" height="24" fill="white"/><circle class="moon-cutout" cx="25" cy="1" r="6" fill="black"/></mask></defs><g class="sun-rays" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></g><circle class="sun-disc" cx="12" cy="12" r="5" fill="currentColor" mask="url(#themeMoonMask)"/></svg>';
  const firstControl = actions.querySelector('.topbar-icon-btn');
  if (firstControl) firstControl.insertAdjacentElement('afterend', button);
  else actions.prepend(button);
  function update() {
    const dark = document.documentElement.dataset.theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối');
    button.title = dark ? 'Chế độ sáng' : 'Chế độ tối';
  }
  button.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    update();
    try { localStorage.setItem('studyhub-theme', theme); } catch { /* Theme remains active for this page. */ }
  });
  window.addEventListener('storage', event => {
    if (event.key === 'studyhub-theme') { document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light'; update(); }
  });
  update();
}

// ── Active nav highlight ──────────────────────────────────────
function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const activePage = document.body.dataset.activeNav || currentPage;
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    const active = item.dataset.page === activePage;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

// ── Toggle password visibility ────────────────────────────────
function initPasswordToggles() {
  document.querySelectorAll('.eye-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.form-group').querySelector('input');
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.querySelector('i').className = isHidden
        ? 'fa-regular fa-eye-slash'
        : 'fa-regular fa-eye';
    });
  });
}

// ── Notification toast ────────────────────────────────────────
function showToast(message, type = 'info', duration = 3000) {
  const colors = { info: '#2563eb', success: '#22c55e', error: '#ef4444' };
  const icons  = { info: 'fa-circle-info', success: 'fa-circle-check', error: 'fa-circle-xmark' };

  const toast = document.createElement('div');
  toast.innerHTML = `
    <i class="fa-solid ${icons[type]}"></i>
    <span>${message}</span>
  `;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', right: '24px',
    background: colors[type], color: '#fff',
    padding: '12px 18px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13.5px', fontWeight: '500',
    boxShadow: '0 8px 24px rgba(0,0,0,.18)',
    zIndex: '9999', opacity: '0',
    transform: 'translateY(12px)',
    transition: 'opacity .25s, transform .25s',
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Format file size ──────────────────────────────────────────
function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return bytes + ' B';
}

// ── Debounce ──────────────────────────────────────────────────
function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Sidebar preference is shared by both static and template-rendered pages.
function initSidebarToggle() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || sidebar.querySelector('.sidebar-toggle')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sidebar-toggle';
  const navigation = sidebar.querySelector('.sidebar-nav');
  if (navigation) {
    navigation.id = navigation.id || 'sidebarNavigation';
    button.setAttribute('aria-controls', navigation.id);
  }
  sidebar.querySelector('.sidebar-logo').insertAdjacentElement('afterend', button);
  let collapsed = window.matchMedia('(max-width: 768px)').matches;
  try {
    const saved = localStorage.getItem('studyhub-sidebar-collapsed');
    if (saved !== null) collapsed = saved === 'true';
  } catch { /* The toggle still works when browser storage is unavailable. */ }
  function render() {
    sidebar.classList.toggle('is-collapsed', collapsed);
    sidebar.classList.toggle('is-expanded', !collapsed);
    const label = collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-expanded', String(!collapsed));
    button.title = label;
    button.innerHTML = `<i class="fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}" aria-hidden="true"></i><span>Thu gọn</span>`;
    sidebar.querySelectorAll('.nav-item').forEach(link => {
      const text = link.querySelector('span');
      if (text) {
        link.setAttribute('aria-label', text.textContent.trim());
        if (collapsed) link.title = text.textContent.trim();
        else link.removeAttribute('title');
      }
    });
  }
  button.addEventListener('click', () => {
    collapsed = !collapsed;
    render();
    try { localStorage.setItem('studyhub-sidebar-collapsed', String(collapsed)); } catch { /* Keep the session preference. */ }
  });
  render();
}

function initCustomCursor() {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!finePointer.matches) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const layers = ['glow', 'ring', 'dot'].map(name => {
    const layer = document.createElement('div');
    layer.className = `custom-cursor cursor-${name}`;
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    return layer;
  });
  let targetX = 0, targetY = 0, ringX = 0, ringY = 0, glowX = 0, glowY = 0;
  let visible = false, frame = null, previousTime = 0;
  const place = (layer, x, y) => { layer.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`; };
  function animate(time) {
    const delta = previousTime ? Math.min(time - previousTime, 50) : 16.67;
    previousTime = time;
    const ringSpeed = reducedMotion.matches ? 1 : 1 - Math.exp(-delta / 32);
    const glowSpeed = reducedMotion.matches ? 1 : 1 - Math.exp(-delta / 45);
    ringX += (targetX - ringX) * ringSpeed;
    ringY += (targetY - ringY) * ringSpeed;
    glowX += (ringX - glowX) * glowSpeed;
    glowY += (ringY - glowY) * glowSpeed;
    const settled = Math.max(Math.abs(targetX - ringX), Math.abs(targetY - ringY), Math.abs(targetX - glowX), Math.abs(targetY - glowY)) < .1;
    if (settled) { ringX = glowX = targetX; ringY = glowY = targetY; }
    place(layers[1], ringX, ringY); place(layers[0], glowX, glowY);
    frame = settled ? null : requestAnimationFrame(animate);
    if (settled) previousTime = 0;
  }
  function hide() {
    visible = false;
    document.documentElement.classList.remove('custom-cursor-active');
    layers.forEach(layer => layer.classList.remove('is-visible'));
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; previousTime = 0;
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || !finePointer.matches) { hide(); return; }
    targetX = event.clientX; targetY = event.clientY;
    // Keep the cursor visible above native modal dialogs in the browser's top layer.
    const parent = event.target.closest('dialog[open]') || document.body;
    layers.forEach(layer => { if (layer.parentElement !== parent) parent.appendChild(layer); });
    if (!visible) {
      ringX = glowX = targetX; ringY = glowY = targetY;
      visible = true;
      layers.forEach(layer => layer.classList.add('is-visible'));
      document.documentElement.classList.add('custom-cursor-active');
    }
    place(layers[2], targetX, targetY);
    layers[1].classList.toggle('is-interactive', Boolean(event.target.closest('a, button, input, textarea, select, label, [role="button"]')));
    if (frame === null) frame = requestAnimationFrame(animate);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  finePointer.addEventListener('change', hide);
  document.addEventListener('pointerdown', () => layers[1].classList.add('is-pressed'));
  document.addEventListener('pointerup', () => layers[1].classList.remove('is-pressed'));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', hide));
}

// ── DOMContentLoaded bootstrap ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initPasswordToggles();
  initSidebarToggle();
  initThemeToggle();
  initCustomCursor();
});
