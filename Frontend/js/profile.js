(() => {
  const key = 'studyhub-profile-v1';
  function read() {
    try { const saved = JSON.parse(localStorage.getItem(key)); if (saved && typeof saved.name === 'string') return { name: saved.name.slice(0, 80), bio: typeof saved.bio === 'string' ? saved.bio.slice(0, 200) : '', photo: typeof saved.photo === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(saved.photo) ? saved.photo : '' }; } catch { /* Use default profile. */ }
    return { name: 'Nguyễn Văn A', bio: 'Sinh viên', photo: '' };
  }
  function avatar(element, profile) {
    element.replaceChildren();
    if (profile.photo) { const image = document.createElement('img'); image.src = profile.photo; image.alt = ''; element.append(image); }
    else element.textContent = profile.name.trim().split(/\s+/).slice(-2).map(word => word[0]).join('').toUpperCase() || 'NA';
  }
  function update() {
    const profile = read();
    document.querySelectorAll('.sidebar-user .user-info h4').forEach(element => element.textContent = profile.name);
    document.querySelectorAll('.sidebar-user .user-info p').forEach(element => element.textContent = profile.bio || 'Sinh viên');
    document.querySelectorAll('.user-avatar, .avatar-btn').forEach(element => avatar(element, profile));
  }
  function init() {
    update();
    const user = document.querySelector('.sidebar-user');
    if (user) {
      user.setAttribute('role', 'button'); user.tabIndex = 0; user.setAttribute('aria-expanded', 'false'); user.setAttribute('aria-controls', 'accountMenu'); user.setAttribute('aria-label', 'Tùy chọn tài khoản');
      const menu = document.createElement('div'); menu.id = 'accountMenu'; menu.className = 'account-menu'; menu.hidden = true;
      menu.innerHTML = '<a href="profile.html"><i class="fa-solid fa-user-pen" aria-hidden="true"></i>Change password</a><button type="button" id="logoutButton"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>Log out</button>';
      document.body.append(menu);
      function close() { menu.hidden = true; user.setAttribute('aria-expanded', 'false'); }
      function toggle() { const opening = menu.hidden; close(); if (opening) { const rect = user.getBoundingClientRect(); menu.style.left = `${rect.left + 8}px`; menu.style.bottom = `${innerHeight - rect.top + 8}px`; menu.hidden = false; user.setAttribute('aria-expanded', 'true'); menu.querySelector('a').focus(); } }
      user.addEventListener('click', toggle);
      user.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } });
      document.addEventListener('click', event => { if (!user.contains(event.target) && !menu.contains(event.target)) close(); });
      document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { close(); user.focus(); } });
      window.addEventListener('resize', close);
      document.getElementById('logoutButton').addEventListener('click', () => { location.href = 'index.html'; });
    }
    const form = document.getElementById('profileForm'); if (!form) return;
    let profile = read();
    const name = document.getElementById('profileName'), bio = document.getElementById('profileBio'), preview = document.getElementById('profilePreview');
    name.value = profile.name; bio.value = profile.bio; avatar(preview, profile);
    document.getElementById('profilePhoto').addEventListener('change', event => {
      const file = event.target.files[0]; if (!file) return;
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) { document.getElementById('profileStatus').textContent = 'Chọn ảnh PNG, JPG hoặc WEBP dưới 1 MB.'; event.target.value = ''; return; }
      const reader = new FileReader(); reader.onload = () => { profile.photo = reader.result; avatar(preview, profile); }; reader.readAsDataURL(file);
    });
    document.getElementById('removePhoto').addEventListener('click', () => { profile.photo = ''; document.getElementById('profilePhoto').value = ''; avatar(preview, profile); });
    form.addEventListener('submit', event => { event.preventDefault(); if (!name.value.trim()) return; profile.name = name.value.trim(); profile.bio = bio.value.trim(); try { localStorage.setItem(key, JSON.stringify(profile)); update(); document.getElementById('profileStatus').textContent = 'Đã lưu hồ sơ trên trình duyệt này.'; } catch { document.getElementById('profileStatus').textContent = 'Không thể lưu hồ sơ. Bộ nhớ trình duyệt có thể đã đầy.'; } });
    document.getElementById('passwordForm').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget, status = document.getElementById('passwordStatus'), password = document.getElementById('newPassword').value, confirm = document.getElementById('confirmPassword').value;
      if (password !== confirm) { status.textContent = 'Mật khẩu xác nhận không khớp.'; return; }
      if (password.length < 8) { status.textContent = 'Mật khẩu mới cần ít nhất 8 ký tự.'; return; }
      const config = window.StudyHubAccountApi;
      if (!config?.enabled) { status.textContent = 'Chưa kết nối máy chủ tài khoản. Mật khẩu chưa được thay đổi.'; form.reset(); return; }
      const button = form.querySelector('button[type="submit"]'); button.disabled = true;
      try {
        const response = await fetch(config.passwordEndpoint, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: document.getElementById('currentPassword').value, newPassword: password }), signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error();
        status.textContent = 'Đã thay đổi mật khẩu.'; form.reset();
      } catch { status.textContent = 'Không thể đổi mật khẩu. Kiểm tra mật khẩu hiện tại hoặc thử lại.'; }
      finally { button.disabled = false; }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
