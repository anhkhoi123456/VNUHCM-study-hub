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
    sidebar.innerHTML = `<div class="sidebar-logo"><div class="logo-icon"><img class="studyhub-mark" src="assets/studyhub-mark.svg" alt="" width="44" height="44"></div><div class="logo-text"><h2 class="studyhub-wordmark">Study<span class="studyhub-hub">Hub</span></h2></div></div>
      <nav class="sidebar-nav" aria-label="Điều hướng chính">${navigation.map(([href, glyph, label]) => `<a class="nav-item" href="${href}" ${href === '#' ? '' : `data-page="${href}"`}>${icon(glyph)}<span>${escape(label)}</span></a>`).join('')}</nav>
      <div class="sidebar-user"><div class="user-avatar">NA</div><div class="user-info"><h4>Nguyễn Văn A</h4><p>Sinh viên</p></div>${icon('fa-solid fa-chevron-up chevron')}</div>`;
  });
  document.querySelectorAll('[data-app-actions]').forEach(actions => {
    actions.innerHTML = `<button class="topbar-icon-btn" type="button" title="Thông báo" aria-label="Thông báo">${icon('fa-regular fa-bell')}</button><div class="avatar-btn">NA</div>`;
    actions.querySelector('button').addEventListener('click', () => showToast('Không có thông báo mới', 'info'));
  });
})();
