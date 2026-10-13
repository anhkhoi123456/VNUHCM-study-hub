/** Sample documents for the library grid. Add an image path to replace a CSS preview. */
const documents = [
  { title: 'Cấu trúc dữ liệu và giải thuật – Bài giảng Chương 1', type: 'pdf', school: 'UIT', subject: 'ctdl', size: '2.4 MB', date: '2024-06-20', art: 'math', visual: '∫ f(x)dx  ∑', image: '' }, // image: '../resources/documents/cau-truc-du-lieu.webp'
  { title: 'Hệ điều hành – Chương 1: Giới thiệu', type: 'doc', school: 'UIT', subject: 'he-dieu-hanh', size: '1.8 MB', date: '2024-06-15', art: 'tree', visual: '<i class="fa-solid fa-sitemap"></i>', image: '' }, // image: '../resources/documents/he-dieu-hanh.webp'
  { title: 'Xác suất thống kê – Bài giảng tổng hợp', type: 'pdf', school: 'HCMUS', subject: 'xac-suat', size: '1.2 MB', date: '2024-06-10', art: 'terminal', visual: '<i class="fa-solid fa-microchip"></i><span>&gt;_</span>', image: '' }, // image: '../resources/documents/xac-suat-thong-ke.webp'
  { title: 'Mạng máy tính – Slide bài giảng Chương 3', type: 'ppt', school: 'UIT', subject: 'mang-may-tinh', size: '3.6 MB', date: '2024-06-08', art: 'statistics', visual: '<i class="fa-solid fa-chart-area"></i>', image: '' }, // image: '../resources/documents/mang-may-tinh.webp'
  { title: 'Đề thi giữa kỳ CTDL – HK1 2023-2024', type: 'pdf', school: 'HCMUS', subject: 'ctdl', size: '0.8 MB', date: '2024-06-05', art: 'network', visual: '<i class="fa-solid fa-network-wired"></i>', image: '' }, // image: '../resources/documents/de-thi-ctdl.webp'
  { title: 'Danh sách bài tập lập trình CTDL', type: 'xlsx', school: 'UIT', subject: 'ctdl', size: '0.4 MB', date: '2024-06-01', art: 'database', visual: '<i class="fa-solid fa-database"></i><span>SQL</span>', image: '' }, // image: '../resources/documents/bai-tap-ctdl.webp'
  { title: 'Báo cáo thực hành CTDL – Lab 01', type: 'doc', school: 'UIT', subject: 'ctdl', size: '1.1 MB', date: '2024-05-25', art: 'bars', visual: '<i class="fa-solid fa-chart-column"></i>', image: '' }, // image: '../resources/documents/bao-cao-ctdl.webp'
  { title: 'Giải thuật sắp xếp – Bubble, Quick, Merge Sort', type: 'ppt', school: 'UIT', subject: 'ctdl', size: '2.9 MB', date: '2024-05-20', art: 'code', visual: '<span>for (int i = 0; i &lt; n; i++) {<br>&nbsp; swap(a[i], a[j]);<br>}</span>', image: '' } // image: '../resources/documents/giai-thuat-sap-xep.webp'
];

const filters = { school: 'all', type: 'all', subject: 'all' };
const grid = document.getElementById('documentGrid');
const emptyMessage = document.getElementById('documentsEmpty');

function renderDocuments() {
  const query = document.getElementById('documentSearch').value.trim().toLocaleLowerCase('vi');
  const sort = document.getElementById('sortDocuments').value;
  const visible = documents.filter(item =>
    (filters.school === 'all' || item.school === filters.school) &&
    (filters.type === 'all' || item.type === filters.type) &&
    (filters.subject === 'all' || item.subject === filters.subject) &&
    (!query || [item.title, item.school, item.subject, item.type].some(value => value.toLocaleLowerCase('vi').includes(query)))
  );
  visible.sort((a, b) => sort === 'title'
    ? a.title.localeCompare(b.title, 'vi')
    : sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));

  grid.innerHTML = visible.map(item => `
    <article class="document-card">
      <a class="document-card-link" href="chatbot.html" aria-label="Mở ${item.title}">
        <div class="document-preview art-${item.art}">
          <span class="preview-visual" aria-hidden="true">${item.visual}</span>
          ${item.image ? `<img class="document-cover" src="${item.image}" alt="" loading="lazy" />` : ''}
          <span class="document-type ${item.type}">${item.type.toUpperCase()}</span>
        </div>
        <div class="document-details"><h2>${item.title}</h2><span class="school-tag">${item.school}</span><span class="document-size">${item.size}</span></div>
      </a>
      <button class="document-menu" type="button" aria-label="Lưu ${item.title}" aria-pressed="false" title="Lưu tài liệu"><i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i></button>
    </article>
  `).join('');
  emptyMessage.hidden = visible.length > 0;
}

document.querySelectorAll('.filter-chip').forEach(button => {
  button.addEventListener('click', () => {
    const group = button.dataset.filter;
    filters[group] = button.dataset.value;
    document.querySelectorAll(`.filter-chip[data-filter="${group}"]`).forEach(chip => {
      const active = chip === button;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    renderDocuments();
  });
});

document.getElementById('subjectFilter').addEventListener('change', event => {
  filters.subject = event.target.value;
  renderDocuments();
});
document.getElementById('sortDocuments').addEventListener('change', renderDocuments);
document.getElementById('documentSearch').addEventListener('input', renderDocuments);
document.getElementById('filtersToggle').addEventListener('click', event => {
  const button = event.currentTarget;
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(expanded));
  document.getElementById('libraryFilters').hidden = !expanded;
});
grid.addEventListener('click', event => {
  const button = event.target.closest('.document-menu');
  if (!button) return;
  const saved = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute('title', saved ? 'Bỏ lưu tài liệu' : 'Lưu tài liệu');
});

const facultyNames = {
  'ky-thuat-may-tinh': 'Kỹ thuật máy tính',
  'he-thong-thong-tin': 'Hệ thống thông tin',
  'cong-nghe-phan-mem': 'Công nghệ phần mềm',
  'khoa-hoc-may-tinh': 'Khoa học máy tính',
  'mang-may-tinh-va-truyen-thong': 'Mạng máy tính và truyền thông',
  'khoa-hoc-va-ky-thuat-thong-tin': 'Khoa học và Kỹ thuật Thông tin'
};
const faculty = facultyNames[new URLSearchParams(location.search).get('faculty')];
const subjectNames = Object.fromEntries(StudyHubCatalog.subjects.map(subject => [subject.id, subject.name]));
const selectedSubject = new URLSearchParams(location.search).get('subject');
if (Object.hasOwn(subjectNames, selectedSubject)) {
  const subjectName = subjectNames[selectedSubject];
  const subjectSelect = document.getElementById('subjectFilter');
  if (![...subjectSelect.options].some(option => option.value === selectedSubject)) {
    subjectSelect.add(new Option(subjectName, selectedSubject));
  }
  subjectSelect.value = selectedSubject;
  filters.subject = selectedSubject;
  document.getElementById('breadcrumbCurrent').textContent = subjectName;
  document.querySelector('.library-topbar-title p').textContent = subjectName;
  document.title = `VNU - StudyHub | ${subjectName}`;
  document.querySelector('.filter-chip[data-filter="school"][data-value="UIT"]').click();
} else if (faculty) {
  document.getElementById('breadcrumbCurrent').textContent = faculty;
  document.title = `VNU - StudyHub | ${faculty}`;
  document.querySelector('.filter-chip[data-filter="school"][data-value="UIT"]').click();
} else {
  renderDocuments();
}
