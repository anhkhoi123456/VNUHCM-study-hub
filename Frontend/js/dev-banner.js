/**
 * VNU - StudyHub  |  Dev Banner
 * Injects and controls the "Under Development" bottom bar.
 * Loaded separately so it can be removed in one line when the
 * site goes live — just delete this <script> tag.
 *
 * Behaviour:
 *   - Auto-injects the banner HTML into <body> on every page.
 *   - Dismissed state is stored in sessionStorage (resets on tab close).
 *   - Applies `has-dev-banner` to <body> so page content gets
 *     the correct bottom padding and nothing hides behind the bar.
 */

(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────────
     Change these values without touching any HTML file.
  ─────────────────────────────────────────────────────────── */
  const CONFIG = {
    version:     'v0.1.0-pre-alpha',
    label:       '🚧 Đang phát triển',
    description: 'Nền tảng hiện đang trong giai đoạn phát triển tích cực. ' +
                 'Một số tính năng có thể chưa hoàn chỉnh hoặc thay đổi mà không báo trước.',
    storageKey:  'devBannerDismissed',   // sessionStorage key
  };

  /* ── Build HTML ─────────────────────────────────────────── */
  function buildBanner() {
    const el = document.createElement('div');
    el.id = 'devBanner';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="dev-pulse" aria-hidden="true">
        <div class="dev-pulse-ring"></div>
        <div class="dev-pulse-core"></div>
      </div>

      <div class="dev-icon" aria-hidden="true">
        <i class="fa-solid fa-code"></i>
      </div>

      <div class="dev-text">
        <span class="dev-label">${CONFIG.label}</span>
        <div class="dev-sep" aria-hidden="true"></div>
        <span class="dev-desc">${CONFIG.description}</span>
      </div>

      <span class="dev-chip">${CONFIG.version}</span>

      <button class="dev-dismiss" title="Ẩn thông báo" aria-label="Ẩn thông báo phát triển">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    `;
    return el;
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    const dismissed = sessionStorage.getItem(CONFIG.storageKey) === 'true';
    const banner    = buildBanner();

    if (dismissed) {
      banner.classList.add('hidden');
    } else {
      document.body.classList.add('has-dev-banner');
    }

    document.body.appendChild(banner);

    /* Dismiss */
    banner.querySelector('.dev-dismiss').addEventListener('click', () => {
      banner.classList.add('hidden');
      document.body.classList.remove('has-dev-banner');
      sessionStorage.setItem(CONFIG.storageKey, 'true');
    });
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

