/** Reusable sidebar and header actions; page content stays in its own template. */
(() => {
  const { escape, icon } = StudyHub;
  const navigation = [
    ['dashboard.html', 'fa-solid fa-house', 'Trang chủ'],
    ['library.html', 'fa-regular fa-calendar-check', 'Kho tài liệu'],
    ['planner.html', 'fa-solid fa-brain', 'AI Planner'],
    ['chatbot.html', 'fa-regular fa-comment-dots', 'AI Chatbot'],
    ['space.html', 'fa-regular fa-user', 'Space cá nhân']
  ];
  document.querySelectorAll('[data-app-sidebar]').forEach(sidebar => {
    sidebar.innerHTML = `<div class="sidebar-logo"><div class="logo-icon"><svg class="brand-book" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M4 7c4-1.5 8-.8 12 1.5V26c-4-2.3-8-3-12-1.5V7Z" fill="white"/><path d="M28 7c-4-1.5-8-.8-12 1.5V26c4-2.3 8-3 12-1.5V7Z" fill="white"/><path d="M16 9v16" stroke="#c0d5ff" stroke-width="1"/><g class="brand-writing" stroke="#3977ee" stroke-width="1.15" stroke-linecap="round"><path class="book-line line-1" pathLength="1" d="m7 11 6 1"/><path class="book-line line-2" pathLength="1" d="m7 15 6 1"/><path class="book-line line-3" pathLength="1" d="m7 19 4 .7"/><path class="book-line line-4" pathLength="1" d="m19 12 6-1"/><path class="book-line line-5" pathLength="1" d="m19 16 6-1"/><path class="book-line line-6" pathLength="1" d="m19 20 4-.7"/></g></svg></div><div class="logo-text"><h2>StudyHub</h2><p>Học thông minh · Vững tương lai</p></div></div>
      <nav class="sidebar-nav" aria-label="Điều hướng chính">${navigation.map(([href, glyph, label]) => `<a class="nav-item" href="${href}" ${href === '#' ? '' : `data-page="${href}"`}>${icon(glyph)}<span>${escape(label)}</span></a>`).join('')}</nav>
      <div class="sidebar-user"><div class="user-avatar">NA</div><div class="user-info"><h4>Nguyễn Văn A</h4><p>Sinh viên</p></div>${icon('fa-solid fa-chevron-up chevron')}</div>`;
  });
  document.querySelectorAll('[data-app-actions]').forEach(actions => {
    actions.innerHTML = `<button class="topbar-icon-btn" type="button" title="Thông báo" aria-label="Thông báo">${icon('fa-regular fa-bell')}</button><div class="avatar-btn">NA</div>`;
    actions.querySelector('button').addEventListener('click', () => showToast('Không có thông báo mới', 'info'));
  });
})();
