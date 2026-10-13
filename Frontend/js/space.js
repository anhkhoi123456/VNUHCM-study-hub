(() => {
  'use strict';
  const { escape, normalize, date } = StudyHub, $ = id => document.getElementById(id);
  const key = 'studyhub-personal-plans-v1', themes = ['math', 'tree', 'system', 'database', 'web', 'history'];
  const samples = [
    ['math', 'Lộ trình học Giải tích (CTTT) 1 tuần', '', '2024-06-20', 7],
    ['tree', 'Lộ trình học Cấu trúc dữ liệu 2 tuần', 'CTTT', '2024-06-15', 14],
    ['system', 'Lộ trình học Hệ điều hành 2 tuần', 'KTPM', '2024-06-10', 14],
    ['database', 'Lộ trình học Cơ sở dữ liệu 2 tuần', 'HTTT', '2024-06-05', 14],
    ['web', 'Lộ trình học Lập trình Web 3 tuần', 'KTPM', '2024-06-01', 21],
    ['history', 'Lộ trình học Tư tưởng Hồ Chí Minh 1 tuần', 'LLCT', '2024-05-25', 7]
  ].map(([theme, title, tag, updated, days], index) => ({ id: `sample-${index}`, theme, title, tag, updated, days, school: 'UIT', author: 'Đặng Anh Khoa' }));
  const valid = plan => plan && typeof plan === 'object' && ['title', 'tag', 'author'].every(field => typeof plan[field] === 'string' && plan[field].length <= 150) && plan.title.trim().length > 0 && ['UIT', 'BKU'].includes(plan.school) && themes.includes(plan.theme) && /^\d{4}-\d{2}-\d{2}$/.test(plan.updated) && Number.isInteger(plan.days) && plan.days > 0 && plan.days <= 365;
  const fields = plan => ({ title: plan.title, tag: plan.tag, author: plan.author, school: plan.school, theme: plan.theme, updated: plan.updated, days: plan.days });
  let plans = samples.map(plan => ({ ...plan }));
  try { const saved = JSON.parse(localStorage.getItem(key)); if (Array.isArray(saved) && saved.length <= 100 && saved.every(plan => valid(plan) && typeof plan.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(plan.id)) && new Set(saved.map(plan => plan.id)).size === saved.length) plans = saved; } catch { /* Use samples when storage is unavailable. */ }
  function save() { try { localStorage.setItem(key, JSON.stringify(plans)); } catch { $('storageNote').textContent = 'Trình duyệt không cho phép lưu. Thay đổi chỉ tồn tại trong phiên này.'; } }
  const artwork = {
    math: '<i class="fa-solid fa-chart-area"></i><span class="formula">∫ f(x) dx</span><span class="graph-lines"><i class="fa-solid fa-wave-square"></i></span>',
    tree: '<i class="fa-solid fa-diagram-project"></i><code>struct Node {\n  int data;\n  Node* left;\n  Node* right;\n};</code>',
    system: '<i class="fa-solid fa-desktop"></i><i class="fa-solid fa-gears"></i><i class="fa-brands fa-linux"></i>',
    database: '<i class="fa-solid fa-database"></i><span>SQL</span><i class="fa-solid fa-table"></i>',
    web: '<i class="fa-solid fa-code"></i><i class="fa-solid fa-list-check"></i>',
    history: '<i class="fa-solid fa-book-open"></i><span class="flag">★</span><i class="fa-solid fa-landmark"></i>'
  };
  function render() {
    const query = normalize($('planSearch').value), school = $('schoolFilter').value, sort = $('planSort').value;
    const visible = plans.filter(plan => normalize(plan.title).includes(query) && (school === 'all' || plan.school === school)).sort((a, b) => sort === 'name' ? a.title.localeCompare(b.title, 'vi') : sort === 'oldest' ? a.updated.localeCompare(b.updated) : b.updated.localeCompare(a.updated));
    $('planGrid').innerHTML = visible.map(plan => `<article class="saved-plan"><div class="plan-cover ${plan.theme}" aria-hidden="true">${artwork[plan.theme]}</div><div class="saved-plan-content"><h2>${escape(plan.title)}</h2><div class="plan-tags"><span>.${plan.school}</span>${plan.tag ? `<span class="tag-${plan.theme}">.${escape(plan.tag)}</span>` : ''}</div><div class="plan-metadata"><p><i class="fa-regular fa-user" aria-hidden="true"></i>Tạo bởi: ${escape(plan.author)}</p><p><i class="fa-regular fa-calendar-days" aria-hidden="true"></i>Cập nhật: <time datetime="${plan.updated}">${date(plan.updated)}</time></p></div><div class="plan-card-actions"><button data-action="share" data-id="${plan.id}"><i class="fa-solid fa-share-nodes"></i> Chia sẻ</button><button data-action="open" data-id="${plan.id}"><i class="fa-regular fa-copy"></i> Mở</button><button data-action="rename" data-id="${plan.id}"><i class="fa-solid fa-pencil"></i> Đổi tên</button></div></div><button class="plan-menu-button" data-action="menu" data-id="${plan.id}" aria-label="Tùy chọn ${escape(plan.title)}"><i class="fa-solid fa-ellipsis-vertical"></i></button></article>`).join('');
    $('spaceEmpty').hidden = visible.length > 0;
  }
  const dialog = $('planDialog'); let opener = null;
  function openDialog(title, html) { if (!dialog.open) opener = document.activeElement; $('dialogHeading').textContent = title; $('dialogContent').innerHTML = html; if (!dialog.open) dialog.showModal(); }
  $('closeDialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { if (opener && opener.isConnected) opener.focus(); });
  function share(plan) {
    const code = 'SH1-' + btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(fields(plan)))));
    openDialog('Chia sẻ lộ trình', '<p>Sao chép mã và gửi cho người nhận. Nhập mã ở Space cá nhân để lưu một bản sao. Mã chứa tên, tác giả và thông tin lộ trình; không chứa tài liệu học.</p><label for="exportCode">Mã chia sẻ</label><textarea id="exportCode" readonly></textarea><div class="dialog-actions"><button id="copyCode">Sao chép mã</button></div>');
    $('exportCode').value = code;
    $('copyCode').addEventListener('click', async () => { try { await navigator.clipboard.writeText(code); showToast('Đã sao chép mã chia sẻ.', 'success'); } catch { $('exportCode').focus(); $('exportCode').select(); showToast('Nhấn Ctrl+C để sao chép mã đã chọn.', 'info'); } });
  }
  function rename(plan) {
    openDialog('Đổi tên lộ trình', '<form id="renameForm"><label for="newPlanName">Tên lộ trình</label><input id="newPlanName" maxlength="150" required /><div class="dialog-actions"><button type="submit">Lưu thay đổi</button></div></form>');
    $('newPlanName').value = plan.title; $('newPlanName').focus();
    $('renameForm').addEventListener('submit', event => { event.preventDefault(); const name = $('newPlanName').value.trim(); if (!name) return; plan.title = name; plan.updated = new Date().toLocaleDateString('sv-SE'); save(); render(); dialog.close(); showToast('Đã đổi tên lộ trình.', 'success'); });
  }
  function openPlan(plan) {
    openDialog(plan.title, `<p>${plan.days} ngày · ${plan.school}${plan.tag ? ` · ${escape(plan.tag)}` : ''} · Tạo bởi ${escape(plan.author)}</p><p>Lộ trình mẫu gồm các bước học sau. Bạn có thể xây dựng lịch chi tiết trong AI Planner.</p><ol class="plan-detail-list"><li>Ôn tập lý thuyết và xác định kiến thức trọng tâm</li><li>Luyện bài tập cơ bản và nâng cao</li><li>Hệ thống hóa kiến thức, ghi chú phần còn yếu</li><li>Luyện đề tổng hợp và tự đánh giá</li></ol><a class="new-plan" href="planner.html">Mở AI Planner <i class="fa-solid fa-arrow-right"></i></a>`);
  }
  $('planGrid').addEventListener('click', event => {
    const button = event.target.closest('[data-action]'); if (!button) return;
    const plan = plans.find(plan => plan.id === button.dataset.id); if (!plan) return;
    if (button.dataset.action === 'share') share(plan);
    else if (button.dataset.action === 'rename') rename(plan);
    else if (button.dataset.action === 'open') openPlan(plan);
    else if (button.dataset.action === 'menu') {
      openDialog('Tùy chọn lộ trình', '<div class="dialog-actions"><button id="menuDelete" class="danger"><i class="fa-regular fa-trash-can" aria-hidden="true"></i> Xóa lộ trình</button></div>');
      $('menuDelete').addEventListener('click', () => {
        openDialog('Xóa lộ trình?', `<p>Bạn có chắc chắn muốn xóa lộ trình <strong>${escape(plan.title)}</strong>?</p><p>Lộ trình sẽ bị xóa khỏi Space cá nhân trên trình duyệt này.</p><div class="dialog-actions"><button id="cancelDelete" class="secondary">Hủy</button><button id="confirmDelete" class="danger">Xóa lộ trình</button></div>`);
        $('cancelDelete').addEventListener('click', () => dialog.close());
        $('confirmDelete').addEventListener('click', () => {
          plans = plans.filter(item => item.id !== plan.id);
          save();
          render();
          dialog.close();
          $('planSearch').focus();
          showToast('Đã xóa lộ trình.', 'success');
        });
        $('cancelDelete').focus();
      });
    }
  });
  $('receiveForm').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const code = $('shareCode').value.trim(); if (!code.startsWith('SH1-') || code.length > 10000) throw new Error('invalid');
      const plan = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(code.slice(4)), char => char.charCodeAt(0))));
      if (!valid(plan) || plans.length >= 100) throw new Error('invalid');
      plans.push({ ...fields(plan), id: `import-${crypto.randomUUID()}` }); save();
      $('shareCode').value = ''; $('planSearch').value = ''; $('schoolFilter').value = 'all'; $('planSort').value = 'newest'; render(); showToast('Đã nhận và lưu bản sao lộ trình.', 'success');
    } catch { showToast('Mã không hợp lệ hoặc đã đạt giới hạn 100 lộ trình.', 'error'); }
  });
  $('planSearch').addEventListener('input', render); $('schoolFilter').addEventListener('change', render); $('planSort').addEventListener('change', render);
  render();
})();
