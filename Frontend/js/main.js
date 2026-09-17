/**
 * VNU - StudyHub | Shared JavaScript
 * Utility functions used across all pages
 */

// ── Active nav highlight ──────────────────────────────────────
function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === currentPage);
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

// ── DOMContentLoaded bootstrap ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initPasswordToggles();
});
