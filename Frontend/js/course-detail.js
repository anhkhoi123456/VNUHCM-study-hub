/** Reusable course-detail page: change data-course-id and add a course record. */
(async () => {
  const { escape, icon, date, normalize, breadcrumbs, path } = StudyHub;
  const main = document.querySelector('[data-course-id]');
  const course = StudyHubCourses[main.dataset.courseId];
  if (!course) {
    main.innerHTML = '<p role="status">Không tìm thấy môn học.</p>';
    return;
  }
  document.title = `VNU - StudyHub | ${course.title}`;
  let storageError = '';
  try { course.documents = await StudyHubAdmin.merge(main.dataset.courseId, course.documents); }
  catch (error) { storageError = error.message; }
  const admin = StudyHubAdmin.isAdmin();
  const types = [...new Set(course.documents.map(doc => doc.type))];
  main.innerHTML = `<nav class="library-breadcrumb" aria-label="Đường dẫn">${breadcrumbs([...path, { label: course.title }])}</nav>
    <section class="course-hero" aria-labelledby="courseTitle">
      <div class="course-icon" aria-hidden="true">${icon('fa-solid fa-sitemap')}</div>
      <div class="course-heading"><h1 id="courseTitle">${escape(course.title)}</h1><p>${escape(course.department)}</p><div class="course-meta"><span>${icon('fa-regular fa-file-lines')}${course.documents.length} tài liệu</span><span>${icon('fa-regular fa-user')}GV: ${escape(course.lecturer)}</span><span>${icon('fa-regular fa-clock')}Cập nhật: ${date(course.updated)}</span></div></div>
      <div class="course-header-art" aria-hidden="true"><svg class="course-tree-art" viewBox="0 0 260 180" fill="none"><path d="M130 28 76 84M130 28l54 56M76 84l-43 65M76 84l54 65M184 84l-54 65M184 84l43 65" stroke="currentColor" stroke-opacity=".35" stroke-width="3"/><g stroke="currentColor" stroke-width="2.5"><circle cx="130" cy="28" r="17" fill="var(--tree-node)"/><circle cx="76" cy="84" r="17" fill="var(--tree-node)"/><circle cx="184" cy="84" r="17" fill="var(--tree-node)"/><circle cx="33" cy="149" r="17" fill="var(--tree-leaf)"/><circle cx="130" cy="149" r="17" fill="var(--tree-leaf)"/><circle cx="227" cy="149" r="17" fill="var(--tree-leaf)"/></g></svg><pre class="course-node-code">struct Node {
  int data;
  Node* left;
  Node* right;
};</pre></div>
    </section>
    <div class="course-toolbar"><div class="course-type-filters" role="group" aria-label="Lọc loại tài liệu">
      <button type="button" class="course-type active" data-type="all" aria-pressed="true">Tất cả (${course.documents.length})</button>
      ${types.map(type => `<button type="button" class="course-type" data-type="${escape(type)}" aria-pressed="false"><span class="file-glyph ${escape(type.toLowerCase())}" aria-hidden="true">${icon('fa-solid fa-file')}</span>${escape(type)} (${course.documents.filter(doc => doc.type === type).length})</button>`).join('')}
    </div><label class="course-search">${icon('fa-solid fa-magnifying-glass')}<input type="search" id="courseSearch" placeholder="Tìm kiếm tài liệu trong môn học..." aria-label="Tìm tài liệu trong môn học" /></label></div>
    <div class="course-table-scroll" role="region" aria-label="Danh sách tài liệu" tabindex="0"><table class="course-table"><caption class="sr-only">Tài liệu môn ${escape(course.title)}</caption><thead><tr><th scope="col">Tên tài liệu</th><th scope="col">Loại</th><th scope="col">Giảng viên</th><th scope="col">Cập nhật</th><th scope="col">Kích thước</th><th scope="col">Lượt xem</th><th scope="col">Thao tác</th></tr></thead><tbody id="courseDocuments"></tbody></table></div>
    <p class="course-empty" id="courseEmpty" role="status" hidden>Không tìm thấy tài liệu phù hợp.</p>`;
  const controls = document.createElement('section');
  controls.className = 'admin-controls';
  controls.innerHTML = `${admin ? `<div class="admin-toolbar"><strong>Admin</strong><span>Manage documents in this browser</span><button type="button" class="document-view" id="uploadDocument">Upload documents</button></div>
    <dialog class="admin-dialog" id="uploadDialog"><form id="uploadForm"><h2>Upload document</h2><p>Saved in this browser only. PDF, PPTX, DOCX or XLSX, up to 20 MB.</p>
    <label>Title<input name="title" maxlength="160" required></label><label>Description<textarea name="description" maxlength="500"></textarea></label>
    <label>File<input name="file" type="file" accept=".pdf,.pptx,.docx,.xlsx" required></label>
    <p id="uploadStatus" role="status"></p><div class="admin-toolbar"><button class="document-view" type="submit">Upload</button><button class="document-view" id="cancelUpload" type="button">Cancel</button></div></form></dialog>` : ''}<p id="adminStatus" role="status"></p>`;
  main.querySelector('.course-toolbar').before(controls);
  document.getElementById('adminStatus').textContent = storageError;
  if (admin) {
    const dialog = document.getElementById('uploadDialog');
    document.getElementById('uploadDocument').addEventListener('click', () => dialog.showModal());
    document.getElementById('cancelUpload').addEventListener('click', () => dialog.close());
    document.getElementById('uploadForm').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      try {
        await StudyHubAdmin.upload(main.dataset.courseId, course, form.elements.file.files[0], form.elements.title.value, form.elements.description.value);
        location.reload();
      } catch (error) { document.getElementById('uploadStatus').textContent = error.message; button.disabled = false; }
    });
  }
  let selectedType = 'all';
  const tbody = document.getElementById('courseDocuments');
  function render() {
    const query = normalize(document.getElementById('courseSearch').value.trim());
    const documents = course.documents.filter(doc => (selectedType === 'all' || doc.type === selectedType)
      && normalize(`${doc.title} ${doc.description} ${doc.lecturer}`).includes(query));
    tbody.innerHTML = documents.map(doc => `<tr><td><div class="course-document"><span class="document-glyph ${escape(doc.type.toLowerCase())}" aria-hidden="true">${icon('fa-solid fa-file')}<b>${escape(doc.type)}</b></span><div><h2>${escape(doc.title)}${doc.master ? '<span class="master-badge">Master</span>' : ''}</h2><p>${escape(doc.description)}</p></div></div></td><td><span class="document-kind ${escape(doc.type.toLowerCase())}">${escape(doc.type)}</span></td><td>${escape(doc.lecturer)}</td><td><time datetime="${escape(doc.updated)}">${date(doc.updated)}</time></td><td>${escape(doc.size)}</td><td>${icon('fa-regular fa-eye')} ${escape(doc.views)}</td><td><a class="document-view" href="file.html?document=${encodeURIComponent(doc.id)}&amp;course=${encodeURIComponent(main.dataset.courseId)}" aria-label="Xem ${escape(doc.title)}">${icon('fa-regular fa-eye')}Xem</a>${admin ? `<button type="button" class="document-view document-delete" data-delete="${escape(doc.id)}" aria-label="Delete ${escape(doc.title)}">${icon('fa-regular fa-trash-can')}Delete</button>` : ''}</td></tr>`).join('');
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
  tbody.addEventListener('click', async event => {
    const button = event.target.closest('[data-delete]');
    if (!button || !StudyHubAdmin.isAdmin()) return;
    const doc = course.documents.find(item => item.id === button.dataset.delete);
    if (!doc || !confirm(`Delete "${doc.title}" from this browser's document list?`)) return;
    button.disabled = true;
    try { await StudyHubAdmin.remove(main.dataset.courseId, doc.id); location.reload(); }
    catch (error) { document.getElementById('adminStatus').textContent = error.message; button.disabled = false; }
  });
  document.getElementById('courseSearch').addEventListener('input', render);
  render();
})();
