/** Sample documents for the library grid. Add an image path to replace a CSS preview. */
const documents = window.StudyHubLibraryDocuments;

const filters = { school: 'all', type: 'all', subject: 'all' };
const grid = document.getElementById('documentGrid');
const emptyMessage = document.getElementById('documentsEmpty');
const libraryStateKey = 'studyhub-library-actions-v1';
let libraryState = { pinned: [], deleted: [] };
try {
  const saved = JSON.parse(localStorage.getItem(libraryStateKey));
  if (saved && Array.isArray(saved.pinned) && Array.isArray(saved.deleted)) {
    const ids = new Set(documents.map(item => item.id));
    libraryState = { pinned: saved.pinned.filter(id => ids.has(id)), deleted: saved.deleted.filter(id => ids.has(id)) };
  }
} catch { /* Actions remain usable without browser storage. */ }
function saveLibraryState() {
  try { localStorage.setItem(libraryStateKey, JSON.stringify(libraryState)); }
  catch { showToast('Thay đổi chỉ được lưu trong phiên này.', 'info'); }
}
function closeDocumentMenus() {
  grid.querySelectorAll('.document-options').forEach(menu => { menu.hidden = true; });
  grid.querySelectorAll('.document-menu').forEach(button => button.setAttribute('aria-expanded', 'false'));
}

function renderDocuments() {
  const query = document.getElementById('documentSearch').value.trim().toLocaleLowerCase('vi');
  const sort = document.getElementById('sortDocuments').value;
  const visible = documents.filter(item =>
    !libraryState.deleted.includes(item.id) &&
    (filters.school === 'all' || item.school === filters.school) &&
    (filters.type === 'all' || item.type === filters.type) &&
    (filters.subject === 'all' || item.subject === filters.subject) &&
    (!query || [item.title, item.school, item.subject, item.type].some(value => value.toLocaleLowerCase('vi').includes(query)))
  );
  visible.sort((a, b) => Number(libraryState.pinned.includes(b.id)) - Number(libraryState.pinned.includes(a.id)) || (sort === 'title'
    ? a.title.localeCompare(b.title, 'vi')
    : sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));

  grid.innerHTML = visible.map(item => `
    <article class="document-card" data-document="${item.id}">
      <a class="document-card-link" href="chatbot.html" aria-label="Mở ${item.title}">
        <div class="document-preview art-${item.art}">
          <span class="preview-visual" aria-hidden="true">${item.visual}</span>
          ${item.image ? `<img class="document-cover" src="${item.image}" alt="" loading="lazy" />` : ''}
          <span class="document-type ${item.type}">${item.type.toUpperCase()}</span>
        </div>
        <div class="document-details"><h2>${item.title}</h2><span class="school-tag">${item.school}</span><span class="document-size">${item.size}</span></div>
      </a>
      ${libraryState.pinned.includes(item.id) ? '<span class="document-pin" title="Đã ghim"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i><span>Đã ghim</span></span>' : ''}
      <button class="document-menu" type="button" aria-label="Tùy chọn ${item.title}" aria-expanded="false" aria-controls="options-${item.id}" title="Tùy chọn tài liệu"><i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i></button>
      <div class="document-options" id="options-${item.id}" hidden>
        <button type="button" data-action="pin"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i>${libraryState.pinned.includes(item.id) ? 'Unpin' : 'Pin'}</button>
        <button type="button" data-action="delete" class="delete-document"><i class="fa-regular fa-trash-can" aria-hidden="true"></i>Delete</button>
      </div>
    </article>
  `).join('');
  emptyMessage.hidden = visible.length > 0;
  document.getElementById('deletedDocumentsNotice').hidden = libraryState.deleted.length === 0;
  document.getElementById('deletedDocumentsCount').textContent = `${libraryState.deleted.length} tài liệu đã xóa khỏi kho trên trình duyệt này.`;
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
  if (button) {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    closeDocumentMenus();
    if (!expanded) {
      button.setAttribute('aria-expanded', 'true');
      const menu = button.closest('.document-card').querySelector('.document-options');
      menu.hidden = false;
      menu.querySelector('button').focus();
    }
    return;
  }
  const action = event.target.closest('[data-action]');
  if (!action) return;
  const id = action.closest('.document-card').dataset.document;
  if (action.dataset.action === 'pin') {
    libraryState.pinned = libraryState.pinned.includes(id) ? libraryState.pinned.filter(value => value !== id) : [...libraryState.pinned, id];
  } else if (action.dataset.action === 'delete') {
    libraryState.deleted.push(id);
  } else return;
  saveLibraryState();
  renderDocuments();
  if (action.dataset.action === 'pin') grid.querySelector(`[data-document="${id}"] .document-menu`).focus();
  else document.getElementById('restoreDocuments').focus();
});
document.addEventListener('click', event => { if (!event.target.closest('.document-menu, .document-options')) closeDocumentMenus(); });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const button = grid.querySelector('.document-menu[aria-expanded="true"]');
  closeDocumentMenus();
  if (button) button.focus();
});
document.getElementById('restoreDocuments').addEventListener('click', () => {
  libraryState.deleted = [];
  saveLibraryState();
  renderDocuments();
  document.getElementById('documentSearch').focus();
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
  document.title = `VNU - StudyHub | ${subjectName}`;
  document.querySelector('.filter-chip[data-filter="school"][data-value="UIT"]').click();
} else if (faculty) {
  document.getElementById('breadcrumbCurrent').textContent = faculty;
  document.title = `VNU - StudyHub | ${faculty}`;
  document.querySelector('.filter-chip[data-filter="school"][data-value="UIT"]').click();
} else {
  renderDocuments();
}
