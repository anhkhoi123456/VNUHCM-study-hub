/** Sample subjects for UIT / Information Systems / CTTT. */
const subjectGrid = document.getElementById('subjectGrid');
const subjectCards = [...subjectGrid.querySelectorAll('.subject-card')];
const savedSubjectsKey = `studyhub:${subjectGrid.dataset.subjectGroup}:saved-subjects`;
let savedSubjects;
try {
  const stored = JSON.parse(localStorage.getItem(savedSubjectsKey) || '[]');
  savedSubjects = new Set(Array.isArray(stored) ? stored : []);
} catch {
  savedSubjects = new Set();
}

function normalizeSubject(value) {
  return StudyHub.normalize(value);
}

function renderSubjects() {
  const query = normalizeSubject(document.getElementById('subjectSearch').value.trim());
  const semester = document.getElementById('semesterFilter').value;
  const type = document.getElementById('courseTypeFilter').value;
  const lecturer = document.getElementById('lecturerFilter').value;
  const sort = document.getElementById('subjectSort').value;
  let visible = 0;
  subjectCards.sort((a, b) => sort === 'name'
    ? a.dataset.name.localeCompare(b.dataset.name, 'vi')
    : sort === 'oldest' ? a.dataset.date.localeCompare(b.dataset.date) : b.dataset.date.localeCompare(a.dataset.date));
  subjectCards.forEach(card => {
    const data = card.dataset;
    card.hidden = !(normalizeSubject(data.name).includes(query)
      && (semester === 'all' || data.semester === semester)
      && (type === 'all' || data.type === type)
      && (lecturer === 'all' || data.lecturer === lecturer));
    if (!card.hidden) visible++;
    subjectGrid.appendChild(card);
  });
  document.getElementById('subjectsEmpty').hidden = visible > 0;
}

function updateSubjectSave(card) {
  const saved = savedSubjects.has(card.dataset.id);
  const button = card.querySelector('.subject-save');
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute('aria-label', `${saved ? 'Bỏ lưu' : 'Lưu'} môn ${card.dataset.name}`);
  button.querySelector('span').textContent = saved ? 'Đã lưu vào Kho Tài liệu' : 'Lưu vào Kho Tài liệu';
  button.querySelector('i').className = `${saved ? 'fa-solid' : 'fa-regular'} fa-bookmark`;
}

subjectCards.forEach(card => {
  updateSubjectSave(card);
  card.querySelector('.subject-save').addEventListener('click', () => {
    const next = new Set(savedSubjects);
    if (next.has(card.dataset.id)) next.delete(card.dataset.id);
    else next.add(card.dataset.id);
    try {
      localStorage.setItem(savedSubjectsKey, JSON.stringify([...next]));
    } catch {
      showToast('Không thể lưu môn trên trình duyệt này.', 'error');
      return;
    }
    savedSubjects = next;
    updateSubjectSave(card);
  });
});
document.getElementById('subjectSearch').addEventListener('input', renderSubjects);
['semesterFilter', 'courseTypeFilter', 'lecturerFilter', 'subjectSort'].forEach(id => {
  document.getElementById(id).addEventListener('change', renderSubjects);
});
document.getElementById('subjectFiltersToggle').addEventListener('click', event => {
  const button = event.currentTarget;
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(expanded));
  document.getElementById('subjectFilters').hidden = !expanded;
});
renderSubjects();
