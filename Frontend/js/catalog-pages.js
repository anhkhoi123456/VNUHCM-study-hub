/** Render catalogs from data with the same card templates and search behavior. */
(() => {
  const { escape, icon, breadcrumbs, folderCard, schoolCard, subjectCard, normalize, path } = StudyHub;
  const catalog = StudyHubCatalog;
  const schoolGrid = document.querySelector('[data-school-grid]');
  if (schoolGrid) schoolGrid.innerHTML = catalog.schools.map(schoolCard).join('');

  const page = document.querySelector('[data-catalog-page]');
  if (page) {
    const view = catalog.pages[page.dataset.catalogPage];
    const heading = view.image
      ? `<img src="${escape(view.image)}" alt="${escape(view.imageAlt)}" />`
      : `<div class="major-heading-icon theme-purple" aria-hidden="true">${icon(view.icon)}</div>`;
    page.innerHTML = `<nav class="library-breadcrumb" aria-label="Đường dẫn">${breadcrumbs(view.breadcrumbs)}</nav>
      <div class="library-heading">${heading}<div><h1>${escape(view.title)}</h1><p>${escape(view.subtitle)}</p></div></div>
      <div class="faculty-grid">${catalog[view.items].map(folderCard).join('')}</div><p class="faculty-empty" role="status" hidden>${escape(view.empty)}</p>`;
    const input = document.getElementById('facultySearch');
    input.setAttribute('aria-label', view.search);
    input.addEventListener('input', () => {
      const query = normalize(input.value.trim());
      let visible = 0;
      page.querySelectorAll('.faculty-card').forEach(card => {
        card.hidden = !normalize(card.dataset.name).includes(query);
        if (!card.hidden) visible++;
      });
      page.querySelector('.faculty-empty').hidden = visible > 0;
    });
  }
  const subjectGrid = document.querySelector('[data-subject-group]');
  if (subjectGrid) {
    const ids = catalog.subjectGroups[subjectGrid.dataset.subjectGroup];
    const subjects = ids.map(id => catalog.subjects.find(subject => subject.id === id));
    subjectGrid.innerHTML = subjects.map(subjectCard).join('');
    const lecturers = [...new Set(subjects.map(subject => subject.lecturer))];
    document.getElementById('lecturerFilter').innerHTML = '<option value="all">Tất cả</option>' + lecturers.map(lecturer => `<option>${escape(lecturer)}</option>`).join('');
    document.querySelector('.library-breadcrumb').innerHTML = breadcrumbs(path);
  }
})();
