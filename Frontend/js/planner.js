(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const catalog = window.StudyHubLibraryDocuments;
  const importKey = 'studyhub-planner-documents-v1';
  const subjectKey = 'studyhub-planner-subjects-v1';
  let importedIds = [], subjects = [];
  let importedSubjects = [];
  function availableDocuments() {
    let deleted = [];
    try { const state = JSON.parse(localStorage.getItem('studyhub-library-actions-v1')); if (Array.isArray(state?.deleted)) deleted = state.deleted; } catch { /* Use current library samples. */ }
    return catalog.filter(item => !deleted.includes(item.id));
  }
  try { const saved = JSON.parse(localStorage.getItem(importKey)); if (Array.isArray(saved)) importedIds = saved.filter(id => catalog.some(item => item.id === id)); } catch { /* Start with no imported documents. */ }
  importedSubjects = [...new Set(catalog.filter(item => importedIds.includes(item.id)).map(item => item.subject))];
  try { const saved = JSON.parse(localStorage.getItem(subjectKey)); if (Array.isArray(saved)) importedSubjects = saved.filter(id => catalog.some(item => item.subject === id)); } catch { /* Migrate the previous document selection to subjects. */ }
  const subjectName = id => window.StudyHubCatalog.subjects.find(subject => subject.id === id)?.name || ({ 'he-dieu-hanh': 'Hệ điều hành', 'xac-suat': 'Xác suất thống kê', 'mang-may-tinh': 'Mạng máy tính' })[id] || id;
  const subjectArt = id => ({
    ctdl: ['pink', 'fa-diagram-project'],
    'he-dieu-hanh': ['green', 'fa-desktop'],
    'xac-suat': ['orange', 'fa-chart-column'],
    'mang-may-tinh': ['blue', 'fa-network-wired'],
    'giai-tich': ['purple', 'fa-calculator']
  })[id] || ['purple', 'fa-book-open'];
  function syncSubjects() {
    importedSubjects = [...new Set(importedSubjects)].filter(id => availableDocuments().some(item => item.subject === id));
    importedIds = availableDocuments().filter(item => importedSubjects.includes(item.subject)).map(item => item.id);
    const groups = new Map();
    catalog.filter(item => importedIds.includes(item.id)).forEach(item => {
      if (!groups.has(item.subject)) groups.set(item.subject, { id: item.subject, name: window.StudyHubCatalog.subjects.find(subject => subject.id === item.subject)?.name || ({ 'he-dieu-hanh': 'Hệ điều hành', 'xac-suat': 'Xác suất thống kê', 'mang-may-tinh': 'Mạng máy tính' })[item.subject] || item.subject, count: 0, icon: 'fa-file-lines', documents: [] });
      const group = groups.get(item.subject); group.count++; group.documents.push(item);
    });
    subjects = [...groups.values()];
    selectedSubject = Math.min(selectedSubject, Math.max(0, subjects.length - 1));
    try { localStorage.setItem(importKey, JSON.stringify(importedIds)); localStorage.setItem(subjectKey, JSON.stringify(importedSubjects)); } catch { /* Selection remains in memory. */ }
  }
  const topics = [
    ['Tổng quan và Cài đặt môi trường', 'Ôn tập chương 1 – Giới thiệu về CTDL', 'Cài đặt môi trường và IDE', 'Làm 5 bài tập cơ bản'],
    ['Mảng và Danh sách liên kết', 'Học lý thuyết mảng, danh sách liên kết', 'Làm bài tập cơ bản và nâng cao', 'Tóm tắt kiến thức'],
    ['Ngăn xếp và Hàng đợi', 'Học ngăn xếp (Stack)', 'Học hàng đợi (Queue)', 'Làm bài tập + ôn tập'],
    ['Cây và đồ thị', 'Học cây (Tree)', 'Học đồ thị (Graph)', 'Làm bài tập tổng hợp'],
    ['Sắp xếp và tìm kiếm', 'Ôn Merge Sort và Quick Sort', 'Luyện thuật toán tìm kiếm', 'So sánh độ phức tạp'],
    ['Ôn tập kiến thức trọng tâm', 'Hệ thống hóa các chương đã học', 'Ôn tập phần kiến thức còn yếu', 'Làm bài tập vận dụng'],
    ['Luyện đề tổng hợp', 'Làm đề thi thử', 'Kiểm tra và sửa lỗi', 'Ghi chú các dạng bài quan trọng'],
    ['Tổng kết và củng cố', 'Ôn lại kiến thức trọng tâm', 'Làm bài tự đánh giá', 'Chuẩn bị cho kỳ thi']
  ];
  let selectedSubject = 0, hours = 2;
  const sampleDate = offset => new Date(2026, 5, 20 + offset).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  let sprints = topics.map((topic, index) => ({ title: topic[0], tasks: topic.slice(1), checked: index === 0 || index === 7 ? [true, true, true] : index === 1 ? [true, false, false] : [false, false, false], startDay: index * 2, date: `${sampleDate(index * 2)} - ${sampleDate(index * 2 + 1)}`, duration: ['2h 30m', '3h 00m', '2h 00m', '3h 00m'][index % 4] }));
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  function renderSubjects() {
    const query = normalize($('subjectSearch').value);
    $('subjectList').innerHTML = subjects.map((subject, index) => normalize(subject.name).includes(query) ? `<div class="planner-subject-row ${selectedSubject === index ? 'selected' : ''}"><button class="planner-subject ${selectedSubject === index ? 'selected' : ''}" data-subject="${index}" aria-pressed="${selectedSubject === index}"><span class="subject-icon subject-art-${subjectArt(subject.id)[0]}"><i class="fa-solid ${subjectArt(subject.id)[1]}" aria-hidden="true"></i></span><span><strong>${escape(subject.name)}</strong><small>${subject.count} tài liệu</small></span></button><button class="remove-planner-subject" type="button" data-remove-subject="${escape(subject.id)}" aria-label="Xóa ${escape(subject.name)} khỏi Planner" title="Xóa khỏi Planner"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button></div>` : '').join('');
    $('subjectCount').textContent = `${subjects.length} môn`;
    $('subjectEmpty').hidden = $('subjectList').children.length > 0;
    $('subjectEmpty').textContent = subjects.length ? 'Không tìm thấy môn học.' : 'Chưa thêm tài liệu. Chọn “Thêm môn học” để lấy tài liệu từ Kho tài liệu.';
    $('generatePlan').disabled = subjects.length === 0;
  }
  function renderPlan() {
    const filter = $('weekFilter').value;
    const firstIncomplete = sprints.findIndex(sprint => !sprint.checked.every(Boolean));
    $('sprintList').innerHTML = sprints.map((sprint, index) => {
      if ((filter === '1' && sprint.startDay >= 14) || (filter === '2' && sprint.startDay < 14)) return '';
      const count = sprint.checked.filter(Boolean).length, done = count === sprint.tasks.length;
      return `<article class="planner-sprint ${done ? 'done' : index === firstIncomplete ? 'current' : ''}"><div class="sprint-number">${index + 1}</div><div class="sprint-info"><h4>Sprint ${index + 1}: ${escape(sprint.title)}</h4><p>${escape(sprint.date)}</p></div><div class="sprint-tasks">${sprint.tasks.map((task, taskIndex) => `<label><input type="checkbox" data-sprint="${index}" data-task="${taskIndex}" ${sprint.checked[taskIndex] ? 'checked' : ''} /><span>${escape(task)}</span></label>`).join('')}</div><div class="sprint-status">${done ? '<i class="fa-solid fa-circle-check"></i> Hoàn thành' : `${count}/${sprint.tasks.length} hoàn thành<progress value="${count}" max="${sprint.tasks.length}" aria-label="Tiến độ sprint ${index + 1}"></progress>`}</div><div class="sprint-end"><input type="checkbox" data-complete="${index}" aria-label="Hoàn thành sprint ${index + 1}" ${done ? 'checked' : ''} /><p>${escape(sprint.duration)}</p></div></article>`;
    }).join('');
    const completed = sprints.filter(sprint => sprint.checked.every(Boolean)).length;
    $('overallProgress').max = sprints.length;
    $('overallProgress').value = completed;
    $('progressPercent').textContent = `${Math.round(completed / sprints.length * 100)}%`;
    $('progressText').textContent = `${completed}/${sprints.length} sprint hoàn thành`;
  }
  function setHours(value) {
    hours = Math.min(4, Math.max(0.5, value));
    $('hoursValue').textContent = hours === 0.5 ? '30 phút' : `${hours} giờ`;
    document.querySelectorAll('[data-hours]').forEach(button => { const selected = Number(button.dataset.hours) === hours; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected); });
    $('lessHours').disabled = hours === 0.5;
    $('moreHours').disabled = hours === 4;
  }
  const days = [1, 2, 3, 4, 5, 6, 7, 14, 21, 30];
  $('studyDays').addEventListener('input', event => {
    const position = Number(event.target.value);
    const index = Math.round(position);
    $('daysValue').textContent = index < 6 ? `${days[index]} ngày` : ['1 tuần', '2 tuần', '3 tuần', '1 tháng'][index - 6];
    event.target.setAttribute('aria-valuetext', $('daysValue').textContent);
    event.target.style.background = `linear-gradient(to right, #2863ff ${position / 9 * 100}%, #d5dae3 ${position / 9 * 100}%)`;
  });
  $('studyDays').setAttribute('aria-valuetext', $('daysValue').textContent);
  $('studyDays').addEventListener('keydown', event => {
    const direction = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    event.currentTarget.value = Math.max(0, Math.min(9, Math.round(Number(event.currentTarget.value)) + direction));
    event.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
  });
  $('subjectSearch').addEventListener('input', renderSubjects);
  $('subjectList').addEventListener('click', event => {
    const remove = event.target.closest('[data-remove-subject]');
    if (remove) {
      const activeId = subjects[selectedSubject]?.id;
      importedSubjects = importedSubjects.filter(id => id !== remove.dataset.removeSubject);
      syncSubjects();
      const activeIndex = subjects.findIndex(subject => subject.id === activeId);
      if (activeIndex >= 0) selectedSubject = activeIndex;
      renderSubjects();
      const nextButton = $('subjectList').querySelector('[data-subject]');
      if (nextButton) nextButton.focus(); else $('addSubject').focus();
      showToast('Đã xóa môn học khỏi Planner.', 'success');
      return;
    }
    const button = event.target.closest('[data-subject]');
    if (button) { selectedSubject = Number(button.dataset.subject); renderSubjects(); }
  });
  const picker = $('libraryPicker');
  let pendingIds = new Set();
  function renderPicker() {
    const query = normalize($('pickerSearch').value);
    const groups = new Map();
    availableDocuments().forEach(item => { if (!groups.has(item.subject)) groups.set(item.subject, []); groups.get(item.subject).push(item); });
    const visible = [...groups].filter(([id]) => normalize(subjectName(id)).includes(query));
    $('pickerDocuments').innerHTML = visible.map(([id, items]) => `<label class="picker-document"><span class="subject-icon subject-art-${subjectArt(id)[0]}"><i class="fa-solid ${subjectArt(id)[1]}" aria-hidden="true"></i></span><span class="picker-subject-details"><strong>${escape(subjectName(id))}</strong><small>${items.length} tài liệu · ${[...new Set(items.map(item => item.type.toUpperCase()))].join(', ')} · ${[...new Set(items.map(item => item.school))].join(', ')}</small><small>Bao gồm bài giảng, bài tập và đề thi đã lưu.</small></span><input type="checkbox" value="${id}" aria-label="Chọn ${escape(subjectName(id))}" ${pendingIds.has(id) ? 'checked' : ''} /></label>`).join('');
    $('pickerEmpty').hidden = visible.length > 0;
    $('importDocuments').disabled = pendingIds.size === 0;
  }
  $('addSubject').addEventListener('click', () => { syncSubjects(); renderSubjects(); pendingIds = new Set(importedSubjects); $('pickerSearch').value = ''; renderPicker(); $('pickerDocuments').scrollTop = 0; picker.showModal(); $('pickerSearch').focus(); });
  $('closeLibraryPicker').addEventListener('click', () => picker.close());
  picker.addEventListener('close', () => $('addSubject').focus());
  $('pickerSearch').addEventListener('input', renderPicker);
  $('pickerDocuments').addEventListener('change', event => { if (event.target.type !== 'checkbox') return; if (event.target.checked) pendingIds.add(event.target.value); else pendingIds.delete(event.target.value); $('importDocuments').disabled = pendingIds.size === 0; });
  $('importDocumentsForm').addEventListener('submit', event => { event.preventDefault(); importedSubjects = [...pendingIds]; syncSubjects(); $('subjectSearch').value = ''; renderSubjects(); picker.close(); showToast(`Đã thêm ${subjects.length} môn học với ${importedIds.length} tài liệu.`, 'success'); });
  window.addEventListener('storage', event => { if (event.key === 'studyhub-library-actions-v1') { syncSubjects(); renderSubjects(); if (picker.open) { pendingIds = new Set([...pendingIds].filter(id => availableDocuments().some(item => item.subject === id))); renderPicker(); } } });
  $('hourOptions').addEventListener('click', event => { const button = event.target.closest('[data-hours]'); if (button) setHours(Number(button.dataset.hours)); });
  $('lessHours').addEventListener('click', () => setHours(hours - 0.5));
  $('moreHours').addEventListener('click', () => setHours(hours + 0.5));
  $('aiRequest').addEventListener('input', event => { $('requestCount').textContent = `${event.target.value.length}/1000`; });
  $('sprintList').addEventListener('change', event => {
    const input = event.target;
    if (input.dataset.complete !== undefined) sprints[Number(input.dataset.complete)].checked.fill(input.checked);
    else if (input.dataset.sprint !== undefined) sprints[Number(input.dataset.sprint)].checked[Number(input.dataset.task)] = input.checked;
    else return;
    renderPlan();
  });
  $('weekFilter').addEventListener('change', renderPlan);
  $('generatePlan').addEventListener('click', () => {
    syncSubjects(); renderSubjects();
    if (!subjects.length) return;
    const totalDays = days[Math.round(Number($('studyDays').value))], subject = subjects[selectedSubject].name;
    const count = Math.min(8, totalDays);
    sprints = Array.from({ length: count }, (_, index) => {
      const start = Math.floor(index * totalDays / count), end = Math.floor((index + 1) * totalDays / count) - 1;
      const format = offset => { const date = new Date(); date.setDate(date.getDate() + offset); return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }); };
      const topic = topics[Math.min(7, Math.floor(index * 8 / count))];
      const tasks = subjects[selectedSubject].id === 'ctdl' ? topic.slice(1) : ['Ôn tập lý thuyết trọng tâm', 'Làm bài tập vận dụng', 'Tóm tắt và tự đánh giá'];
      const minutes = Math.round((end - start + 1) * hours * 60);
      return { title: subjects[selectedSubject].id === 'ctdl' ? topic[0] : `${subject} – Phần ${index + 1}`, tasks, checked: [false, false, false], startDay: start, date: `${format(start)} - ${format(end)}`, duration: `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m` };
    });
    $('weekFilter').value = 'all';
    $('planNote').textContent = `Kế hoạch mẫu: ${subject} · ${subjects[selectedSubject].count} tài liệu đã thêm · ${totalDays} ngày · ${hours} giờ/ngày. Chưa kết nối AI; nội dung tài liệu và yêu cầu tùy chọn chưa được phân tích.`;
    renderPlan();
    showToast('Đã tạo kế hoạch mẫu theo thời gian đã chọn', 'success');
  });
  $('exportPlan').addEventListener('click', () => { showToast('Chọn “Lưu dưới dạng PDF” trong hộp thoại in.', 'info'); window.print(); });
  syncSubjects(); renderSubjects(); setHours(2); renderPlan();
})();
