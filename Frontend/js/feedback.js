(() => {
  const $ = id => document.getElementById(id), form = $('feedbackForm');
  const hints = { technical: 'Mô tả các bước thực hiện, kết quả thực tế và kết quả mong muốn.', accuracy: 'Ghi tên tài liệu, trang / mục có lỗi và nội dung đúng hoặc nguồn tham khảo.', suggestion: 'Bạn muốn cải tiến điều gì? Ý tưởng này giúp việc học như thế nào?', other: 'Chia sẻ ý kiến hoặc trải nghiệm bạn muốn StudyHub biết.' };
  const key = 'studyhub-feedback-draft-v1';
  function readForm() { return { category: form.querySelector('[name="category"]:checked').value, title: $('feedbackTitle').value.trim(), related: $('feedbackPage').value.trim(), details: $('feedbackDetails').value.trim() }; }
  function update() { $('feedbackHint').textContent = hints[readForm().category]; $('feedbackCount').textContent = `${$('feedbackDetails').value.length}/5000`; }
  try {
    const draft = JSON.parse(localStorage.getItem(key));
    if (draft && Object.hasOwn(hints, draft.category)) {
      form.querySelector(`[value="${draft.category}"]`).checked = true;
      for (const [field, id, max] of [['title', 'feedbackTitle', 150], ['related', 'feedbackPage', 300], ['details', 'feedbackDetails', 5000]]) if (typeof draft[field] === 'string') $(id).value = draft[field].slice(0, max);
    }
  } catch { /* Draft storage is optional. */ }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', event => {
    event.preventDefault(); const report = readForm();
    if (!report.title || !report.details) { $('feedbackStatus').textContent = 'Vui lòng nhập tiêu đề và mô tả chi tiết.'; return; }
    try { localStorage.setItem(key, JSON.stringify({ ...report, savedAt: new Date().toISOString() })); $('feedbackStatus').textContent = 'Đã lưu phản hồi trên trình duyệt này. Phản hồi chưa được gửi đến máy chủ.'; }
    catch { $('feedbackStatus').textContent = 'Không thể lưu trên trình duyệt. Bạn có thể tải bản phản hồi bên dưới.'; }
  });
  $('downloadFeedback').addEventListener('click', () => {
    if (!form.reportValidity()) return;
    const report = readForm(); if (!report.title || !report.details) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ ...report, createdAt: new Date().toISOString() }, null, 2)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'studyhub-feedback.json'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('feedbackStatus').textContent = 'Đã tạo bản phản hồi để tải xuống.';
  });
  update();
})();
