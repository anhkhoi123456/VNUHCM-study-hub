/** Reusable course-detail page: change data-course-id and add a course record. */
(() => {
  const { escape, icon, date, normalize, breadcrumbs, path } = StudyHub;
  const main = document.querySelector('[data-course-id]');
  const course = StudyHubCourses[main.dataset.courseId];
  if (!course) {
    main.innerHTML = '<p role="status">Không tìm thấy môn học.</p>';
    return;
  }
  document.title = `VNU - StudyHub | ${course.title}`;
  const types = [...new Set(course.documents.map(doc => doc.type))];
  main.innerHTML = `<nav class="library-breadcrumb" aria-label="Đường dẫn">${breadcrumbs([...path, { label: course.title }])}</nav>
    <section class="course-hero" aria-labelledby="courseTitle">
      <div class="course-icon" aria-hidden="true">${icon('fa-solid fa-sitemap')}</div>
      <div class="course-heading"><h1 id="courseTitle">${escape(course.title)}</h1><p>${escape(course.department)}</p><div class="course-meta"><span>${icon('fa-regular fa-file-lines')}${course.documents.length} tài liệu</span><span>${icon('fa-regular fa-user')}GV: ${escape(course.lecturer)}</span><span>${icon('fa-regular fa-clock')}Cập nhật: ${date(course.updated)}</span></div></div>
      <div class="course-image-placeholder" aria-hidden="true">${icon('fa-regular fa-image')}<span>IMAGE PLACEHOLDER</span></div>
    </section>
    <div class="course-toolbar"><div class="course-type-filters" role="group" aria-label="Lọc loại tài liệu">
      <button type="button" class="course-type active" data-type="all" aria-pressed="true">Tất cả (${course.documents.length})</button>
      ${types.map(type => `<button type="button" class="course-type" data-type="${escape(type)}" aria-pressed="false"><span class="file-glyph ${escape(type.toLowerCase())}" aria-hidden="true">${icon('fa-solid fa-file')}</span>${escape(type)} (${course.documents.filter(doc => doc.type === type).length})</button>`).join('')}
    </div><label class="course-search">${icon('fa-solid fa-magnifying-glass')}<input type="search" id="courseSearch" placeholder="Tìm kiếm tài liệu trong môn học..." aria-label="Tìm tài liệu trong môn học" /></label></div>
    <div class="course-table-scroll" role="region" aria-label="Danh sách tài liệu" tabindex="0"><table class="course-table"><caption class="sr-only">Tài liệu môn ${escape(course.title)}</caption><thead><tr><th scope="col">Tên tài liệu</th><th scope="col">Loại</th><th scope="col">Giảng viên</th><th scope="col">Cập nhật</th><th scope="col">Kích thước</th><th scope="col">Lượt xem</th><th scope="col">Thao tác</th></tr></thead><tbody id="courseDocuments"></tbody></table></div>
    <p class="course-empty" id="courseEmpty" role="status" hidden>Không tìm thấy tài liệu phù hợp.</p>`;
  let selectedType = 'all';
  const tbody = document.getElementById('courseDocuments');
  function render() {
    const query = normalize(document.getElementById('courseSearch').value.trim());
    const documents = course.documents.filter(doc => (selectedType === 'all' || doc.type === selectedType)
      && normalize(`${doc.title} ${doc.description} ${doc.lecturer}`).includes(query));
    tbody.innerHTML = documents.map(doc => `<tr><td><div class="course-document"><span class="document-glyph ${escape(doc.type.toLowerCase())}" aria-hidden="true">${icon('fa-solid fa-file')}<b>${escape(doc.type)}</b></span><div><h2>${escape(doc.title)}${doc.master ? '<span class="master-badge">Master</span>' : ''}</h2><p>${escape(doc.description)}</p></div></div></td><td><span class="document-kind ${escape(doc.type.toLowerCase())}">${escape(doc.type)}</span></td><td>${escape(doc.lecturer)}</td><td><time datetime="${escape(doc.updated)}">${date(doc.updated)}</time></td><td>${escape(doc.size)}</td><td>${icon('fa-regular fa-eye')} ${escape(doc.views)}</td><td><a class="document-view" href="file.html?document=${encodeURIComponent(doc.id)}&amp;course=${encodeURIComponent(main.dataset.courseId)}" aria-label="Xem ${escape(doc.title)}">${icon('fa-regular fa-eye')}Xem</a></td></tr>`).join('');
    document.getElementById('courseEmpty').hidden = documents.length > 0;
  }
  main.querySelectorAll('.course-type').forEach(button => button.addEventListener('click', () => {
    selectedType = button.dataset.type;
    main.querySelectorAll('.course-type').forEach(item => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    render();
  }));
  document.getElementById('courseSearch').addEventListener('input', render);
  render();
})();
