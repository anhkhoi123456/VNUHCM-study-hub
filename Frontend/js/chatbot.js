(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const subjects = [
    { name: 'Cấu trúc dữ liệu và giải thuật', school: 'UIT', count: 245, formats: 'PDF, PPTX, DOC, XLSX', icon: 'fa-diagram-project', color: 'pink' },
    { name: 'Hệ điều hành', school: 'UIT', count: 176, formats: 'PDF, PPTX, DOC', icon: 'fa-desktop', color: 'green' },
    { name: 'Xác suất thống kê', school: 'BKU', count: 198, formats: 'PDF, PPTX, DOC, XLSX', icon: 'fa-chart-column', color: 'orange' },
    { name: 'Giải tích', school: 'BKU', count: 320, formats: 'PDF, PPTX, DOC', icon: 'fa-calculator', color: 'purple' }
  ];
  const selected = new Set([0, 1, 3]);
  function subjectCard(subject, index, added) {
    return `<article class="subject-card"><span class="subject-art ${subject.color}"><i class="fa-solid ${subject.icon}" aria-hidden="true"></i></span><div class="subject-detail"><h4>${escape(subject.name)} <span class="school-badge ${subject.school === 'BKU' ? 'bku' : ''}">.${subject.school}</span></h4><p>${subject.count} tài liệu${added ? '' : ` (${subject.formats})`}</p></div><button class="${added ? 'subject-remove' : 'subject-add'}" data-${added ? 'remove' : 'add'}="${index}" aria-label="${added ? 'Gỡ' : 'Thêm'} ${escape(subject.name)}" ${!added && selected.has(index) ? 'disabled' : ''}><i class="fa-solid ${added ? 'fa-xmark' : selected.has(index) ? 'fa-check' : 'fa-plus'}"></i></button></article>`;
  }
  function renderSubjects() {
    const query = normalize($('subjectSearch').value);
    $('availableSubjects').innerHTML = subjects.map((subject, index) => normalize(subject.name).includes(query) ? subjectCard(subject, index, false) : '').join('');
    $('subjectEmpty').hidden = $('availableSubjects').children.length > 0;
    $('selectedSubjects').innerHTML = [...selected].map(index => subjectCard(subjects[index], index, true)).join('') || '<p class="panel-description">Chưa thêm môn học. Chọn môn học ở danh sách trên.</p>';
    $('selectedCount').textContent = selected.size;
    $('clearSubjects').disabled = selected.size === 0;
  }
  $('subjectSearch').addEventListener('input', renderSubjects);
  $('availableSubjects').addEventListener('click', event => { const button = event.target.closest('[data-add]'); if (button) { selected.add(Number(button.dataset.add)); renderSubjects(); } });
  $('selectedSubjects').addEventListener('click', event => { const button = event.target.closest('[data-remove]'); if (button) { selected.delete(Number(button.dataset.remove)); renderSubjects(); } });
  $('clearSubjects').addEventListener('click', () => { selected.clear(); renderSubjects(); });
  $('subjectSearchForm').addEventListener('submit', event => {
    event.preventDefault();
    const query = normalize($('subjectSearch').value);
    const index = subjects.findIndex((subject, index) => normalize(subject.name).includes(query) && !selected.has(index));
    if (index < 0) { showToast('Không có môn học phù hợp để thêm.', 'info'); return; }
    selected.add(index); renderSubjects();
  });
  const picker = $('documentPicker');
  $('addDocument').addEventListener('click', () => picker.click());
  picker.addEventListener('change', () => {
    const file = picker.files[0]; if (!file) return;
    if (!/\.(pdf|docx?|pptx?|xlsx?|txt)$/i.test(file.name)) { showToast('Vui lòng chọn PDF, Word, PowerPoint, Excel hoặc TXT.', 'error'); picker.value = ''; return; }
    $('documentName').textContent = file.name;
    $('documentMeta').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · Đính kèm cục bộ, chưa đọc nội dung`;
    $('removeDocument').disabled = false;
    showToast('Đã đính kèm cục bộ. Chưa gửi tài liệu đến dịch vụ AI.', 'info');
  });
  $('removeDocument').addEventListener('click', () => { picker.value = ''; $('documentName').textContent = 'Chưa chọn tài liệu'; $('documentMeta').textContent = 'Thêm tài liệu để chuẩn bị phiên học'; $('removeDocument').disabled = true; });
  const replies = [
    [/so sanh|lien ket/, 'Mảng lưu các phần tử liên tiếp trong bộ nhớ và truy cập theo chỉ số trong O(1). Danh sách liên kết lưu các node nối bằng con trỏ; truy cập theo vị trí thường cần O(n). Chèn hoặc xóa node trong O(1) khi đã có con trỏ phù hợp.'],
    [/array|mang/, 'Mảng (Array) lưu các phần tử cùng kiểu dữ liệu liên tiếp trong bộ nhớ. Chỉ số thường bắt đầu từ 0. Ví dụ C++: int arr[3] = {10, 20, 30}; arr[1] có giá trị 20. Truy cập theo chỉ số có độ phức tạp O(1).'],
    [/pointer|con tro/, 'Con trỏ (Pointer) là biến lưu địa chỉ bộ nhớ. Ví dụ C++: int x = 10; int* p = &x; Khi đó *p là 10. Chỉ giải tham chiếu khi con trỏ trỏ tới một đối tượng hợp lệ còn tồn tại.'],
    [/stack|ngan xep/, 'Ngăn xếp (Stack) hoạt động theo LIFO: phần tử thêm sau cùng được lấy ra trước. Ví dụ, thêm 10 rồi 20 bằng push; thao tác pop sẽ lấy 20 ra trước. Stack thường dùng trong hoàn tác thao tác và kiểm tra dấu ngoặc.'],
    [/phuc tap/, 'Độ phức tạp mô tả cách thời gian chạy hoặc bộ nhớ tăng theo kích thước đầu vào n. Ví dụ: truy cập mảng O(1), tìm kiếm tuyến tính O(n), tìm kiếm nhị phân trên dữ liệu đã sắp xếp O(log n).'],
    [/tom tat|chuong 1/, 'Tóm tắt kiến thức mẫu: cấu trúc dữ liệu tổ chức thông tin để truy cập và xử lý hiệu quả. Các cấu trúc cơ bản gồm mảng, danh sách liên kết, ngăn xếp, hàng đợi, cây và đồ thị. Chọn cấu trúc dựa trên các thao tác cần thực hiện và độ phức tạp mong muốn.']
  ];
  function addMessage(text, user) {
    const row = document.createElement('div'); row.className = `message ${user ? 'user' : 'ai'}`;
    const avatar = document.createElement('span'); avatar.className = 'message-avatar'; avatar.textContent = user ? 'NA' : 'AI';
    const content = document.createElement('div'); content.className = 'message-content';
    if (!user) { const note = document.createElement('small'); note.textContent = 'Câu trả lời mẫu · Kiến thức minh họa, không trích từ tài liệu'; content.append(note); }
    content.append(document.createTextNode(text)); row.append(avatar, content); $('aiMessages').append(row);
    $('conversationScroll').scrollTop = $('conversationScroll').scrollHeight;
  }
  function sendMessage() {
    const input = $('chatInput'), text = input.value.trim(); if (!text) return;
    $('welcomeCard').hidden = true; input.value = ''; addMessage(text, true);
    const source = document.querySelector('input[name="knowledgeSource"]:checked').value;
    const reply = replies.find(([pattern]) => pattern.test(normalize(text)));
    addMessage(source === 'planner' ? 'Chế độ lộ trình học chưa kết nối file từ AI Planner. Hãy chuyển sang tài liệu gốc để thử các câu hỏi kiến thức mẫu.' : reply ? reply[1] : 'Phiên bản này chưa kết nối dịch vụ AI nên chưa thể phân tích câu hỏi hoặc tài liệu của bạn. Bạn có thể thử các câu hỏi mẫu về Array, Pointer, Stack và độ phức tạp.', false);
    input.focus();
  }
  $('chatForm').addEventListener('submit', event => { event.preventDefault(); sendMessage(); });
  $('chatInput').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); sendMessage(); } });
  $('suggestions').addEventListener('click', event => { const button = event.target.closest('button'); if (button) { $('chatInput').value = button.textContent; sendMessage(); } });
  $('resetChat').addEventListener('click', () => { $('aiMessages').replaceChildren(); $('welcomeCard').hidden = false; $('chatInput').value = ''; showToast('Đã làm mới cuộc trò chuyện.', 'success'); });
  $('chatSettings').addEventListener('click', () => showToast('Đổi nguồn kiến thức ở cột bên phải. Mô hình AI hiện chỉ là lựa chọn demo.', 'info'));
  $('modelSelect').addEventListener('change', () => showToast('Lựa chọn mô hình chỉ dùng để xem trước; chưa kết nối AI.', 'info'));
  const questions = [
    ['Trong C, cấu trúc dữ liệu nào thường được sử dụng để lưu trữ danh sách các phần tử theo thứ tự?', ['Stack', 'Queue', 'Array', 'Tree'], 2],
    ['Chỉ số đầu tiên của mảng trong C++ là bao nhiêu?', ['0', '1', '-1', 'Tùy kích thước mảng'], 0],
    ['Ngăn xếp (Stack) hoạt động theo nguyên tắc nào?', ['FIFO', 'LIFO', 'Ngẫu nhiên', 'Sắp xếp tăng dần'], 1],
    ['Hàng đợi (Queue) hoạt động theo nguyên tắc nào?', ['LIFO', 'Chia để trị', 'FIFO', 'Đệ quy'], 2],
    ['Con trỏ lưu trữ thông tin gì?', ['Tên biến', 'Địa chỉ bộ nhớ', 'Kiểu tệp', 'Số lượng phần tử'], 1],
    ['Độ phức tạp truy cập phần tử mảng theo chỉ số là gì?', ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], 3],
    ['Để tìm kiếm nhị phân, dữ liệu cần có điều kiện gì?', ['Đã sắp xếp', 'Chỉ có số âm', 'Không có phần tử trùng', 'Có số phần tử chẵn'], 0],
    ['Một node trong danh sách liên kết đơn thường gồm gì?', ['Chỉ dữ liệu', 'Dữ liệu và con trỏ tới node tiếp theo', 'Một mảng cố định', 'Một tệp PDF'], 1],
    ['Thao tác push trên Stack thực hiện việc gì?', ['Xóa toàn bộ Stack', 'Sắp xếp Stack', 'Thêm phần tử vào đỉnh', 'Lấy phần tử ở đáy'], 2],
    ['Độ phức tạp tìm kiếm tuyến tính trong trường hợp xấu nhất là gì?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 2]
  ];
  let questionIndex = 0, answers = Array(questions.length).fill(null), finished = false, examMode = false;
  function renderQuiz() {
    const [question, choices] = questions[questionIndex];
    $('questionBadge').textContent = `Câu ${questionIndex + 1}/${questions.length}`;
    $('questionText').textContent = question;
    $('quizAnswers').innerHTML = '<legend class="sr-only">Chọn câu trả lời</legend>' + choices.map((choice, index) => `<label><input type="radio" name="quizAnswer" value="${index}" ${answers[questionIndex] === index ? 'checked' : ''} /><span>${String.fromCharCode(65 + index)}. ${escape(choice)}</span></label>`).join('');
    $('previousQuestion').disabled = questionIndex === 0;
    $('nextQuestion').innerHTML = questionIndex === questions.length - 1 ? 'Nộp bài <i class="fa-solid fa-check"></i>' : 'Câu tiếp theo <i class="fa-solid fa-chevron-right"></i>';
    $('nextQuestion').disabled = answers[questionIndex] === null;
    if (finished) { const score = answers.filter((answer, index) => answer === questions[index][2]).length; $('quizFeedback').textContent = `Kết quả: ${score}/${questions.length} câu đúng. Câu hiện tại: đáp án ${String.fromCharCode(65 + questions[questionIndex][2])}.`; }
    else $('quizFeedback').textContent = '';
  }
  $('quizAnswers').addEventListener('change', event => { if (event.target.name !== 'quizAnswer') return; answers[questionIndex] = Number(event.target.value); finished = false; renderQuiz(); });
  $('previousQuestion').addEventListener('click', () => { if (questionIndex > 0) { questionIndex--; renderQuiz(); } });
  $('nextQuestion').addEventListener('click', () => { if (answers[questionIndex] === null) return; if (questionIndex < questions.length - 1) questionIndex++; else finished = true; renderQuiz(); });
  function updateQuizHeading() {
    const planner = document.querySelector('input[name="knowledgeSource"]:checked').value === 'planner';
    $('quizHeading').textContent = `${examMode ? 'Đề thi mẫu' : 'Bài trắc nghiệm'} (${planner ? 'Từ lộ trình học' : 'Từ tài liệu gốc'})`;
    $('quizDescription').textContent = `10 câu hỏi mẫu • Cấu trúc dữ liệu – Chương 1${planner ? ' · Chưa đọc lộ trình' : ''}`;
  }
  function resetQuiz(exam = examMode) { examMode = exam; questionIndex = 0; answers.fill(null); finished = false; updateQuizHeading(); renderQuiz(); }
  $('resetQuiz').addEventListener('click', () => resetQuiz());
  $('createQuiz').addEventListener('click', () => { resetQuiz(false); $('quizHeading').scrollIntoView({ block: 'nearest' }); showToast('Đã mở 10 câu hỏi mẫu; chưa phân tích tài liệu.', 'info'); });
  $('createExam').addEventListener('click', () => { resetQuiz(true); $('quizHeading').scrollIntoView({ block: 'nearest' }); showToast('Đã mở đề thi mẫu gồm 10 câu trắc nghiệm.', 'info'); });
  document.querySelectorAll('input[name="knowledgeSource"]').forEach(input => input.addEventListener('change', () => { document.querySelectorAll('.source-option').forEach(option => option.classList.toggle('selected', option.querySelector('input').checked)); resetQuiz(); }));
  renderSubjects(); renderQuiz();
})();
