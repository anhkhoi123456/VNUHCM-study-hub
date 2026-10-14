(() => {
  const form = document.getElementById('loginForm');
  document.querySelectorAll('.social-btn').forEach(button => { button.removeAttribute('onclick'); button.addEventListener('click', () => showToast('Đăng nhập Google/Microsoft chưa được kết nối. Dùng tài khoản cục bộ.', 'info')); });
  document.querySelector('.forgot-link').addEventListener('click', event => { event.preventDefault(); showToast('Khôi phục mật khẩu chưa được kết nối trong bản phát triển.', 'info'); });
  document.querySelector('.signup-row a').addEventListener('click', event => { event.preventDefault(); showToast('Tạo tài khoản bằng lệnh: python Backend/server.py create-user', 'info', 6000); });
  const status = document.createElement('p'); status.id = 'loginStatus'; status.setAttribute('role', 'status'); status.style.cssText = 'margin-top:12px;font-size:13px;line-height:1.6;color:var(--gray-600)'; form.appendChild(status);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const username = document.getElementById('email').value.trim(), passwordInput = document.getElementById('password');
    if (!username || !passwordInput.value) { status.textContent = 'Vui lòng nhập email / MSSV và mật khẩu.'; return; }
    if (location.protocol === 'file:') { status.textContent = 'Mở trang qua máy chủ backend để đăng nhập, không mở trực tiếp file HTML.'; return; }
    const button = form.querySelector('.btn-login'); button.disabled = true; status.textContent = 'Đang đăng nhập…';
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password: passwordInput.value, remember: document.getElementById('remember').checked }), signal: AbortSignal.timeout(15000) });
      if (!response.ok) { status.textContent = response.status === 401 ? 'Email / MSSV hoặc mật khẩu không đúng.' : response.status === 429 ? 'Bạn thử quá nhiều lần. Vui lòng đợi rồi thử lại.' : 'Không thể đăng nhập. Vui lòng thử lại.'; return; }
      location.href = 'dashboard.html';
    } catch { status.textContent = 'Không kết nối được máy chủ đăng nhập. Kiểm tra backend đang chạy.'; }
    finally { passwordInput.value = ''; button.disabled = false; }
  });
})();
