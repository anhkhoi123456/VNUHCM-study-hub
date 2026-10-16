/** Reusable file page. Backend records supply metadata and real file/preview URLs. */
(async () => {
  const { escape, icon, breadcrumbs, path } = StudyHub;
  const api = StudyHubDocumentsApi;
  const config = StudyHubApiConfig;
  const params = new URLSearchParams(window.location.search);
  const documentId = params.get('document') || '';
  const courseId = params.get('course') || '';
  const course = StudyHubCourses[courseId];
  const sample = course?.documents.find(document => document.id === documentId);
  let busy = false;
  const main = document.getElementById('filePage');
  main.innerHTML = `<nav class="library-breadcrumb" id="fileBreadcrumb" aria-label="Đường dẫn"></nav>
    <section class="file-heading" aria-labelledby="fileTitle">
      <div class="file-type-icon" aria-hidden="true">${icon('fa-solid fa-file')}<span id="fileType">FILE</span></div>
      <div class="file-heading-copy"><div class="file-title-line"><h1 id="fileTitle"></h1><span class="file-master" id="fileMaster" hidden>Master</span></div><p id="fileDescription"></p><div class="file-metadata" id="fileMetadata"></div></div>
    </section>
    <section class="file-workspace" aria-label="Trình xem tài liệu">
      <div class="file-controls"><div class="file-source-label">${icon('fa-regular fa-file-lines')}<span id="fileSource">Tài liệu</span></div><div class="file-control-actions"><button class="file-action" type="button" id="retryDocument">${icon('fa-solid fa-rotate-right')}Thử lại</button><a class="file-action" id="openFile" target="_blank" rel="noopener noreferrer" hidden>${icon('fa-solid fa-arrow-up-right-from-square')}Mở tệp gốc</a></div></div>
      <p class="file-status" id="fileStatus" role="status" aria-live="polite"></p>
      <div class="file-preview" id="filePreview"><div class="file-empty" id="fileEmpty">${icon('fa-regular fa-file')}<h2 id="fileEmptyTitle">Chưa có tệp để hiển thị</h2><p id="fileEmptyMessage">Tài liệu sẽ được hiển thị khi nguồn đã kết nối cung cấp đường dẫn tệp.</p></div><iframe id="pdfViewer" title="Nội dung tài liệu PDF" hidden></iframe></div>
    </section>`;
  const el = id => document.getElementById(id);
  if (StudyHubAdmin.isAdmin()) {
    const actions = main.querySelector('.file-control-actions');
    actions.insertAdjacentHTML('afterbegin', `<span class="file-admin-badge">${icon('fa-solid fa-shield-halved')}Admin</span>
      <button class="file-action file-upload" type="button" id="adminUpload">${icon('fa-solid fa-arrow-up-from-bracket')}Upload document</button>
      <button class="file-action file-delete" type="button" id="adminDelete" ${!documentId || !course ? 'disabled' : ''}>${icon('fa-regular fa-trash-can')}Delete document</button>`);
    main.insertAdjacentHTML('beforeend', `<dialog class="file-upload-dialog" id="fileUploadDialog" aria-labelledby="uploadTitle">
      <form id="fileUploadForm"><h2 id="uploadTitle">Upload document</h2>
      <p>Add a document to this course.</p>
      <label for="uploadName">Document title</label><input id="uploadName" name="title" maxlength="160" placeholder="Enter document title" required>
      <label for="uploadDescription">Description</label><textarea id="uploadDescription" name="description" maxlength="500" rows="3" placeholder="Brief description (optional)"></textarea>
      <label for="uploadFile">Choose file</label><input id="uploadFile" name="file" type="file" accept=".pdf,.pptx,.docx,.xlsx" required>
      <p class="file-upload-hint">PDF, PPTX, DOCX or XLSX · Up to 20 MB</p>
      <p id="fileUploadStatus" role="status"></p>
      <div class="file-dialog-actions"><button class="file-action" id="cancelFileUpload" type="button">Cancel</button><button class="file-action file-upload" type="submit">${icon('fa-solid fa-arrow-up-from-bracket')}Upload document</button></div>
      </form></dialog>`);
    el('adminUpload').disabled = !course;
    el('adminUpload').addEventListener('click', () => el('fileUploadDialog').showModal());
    el('cancelFileUpload').addEventListener('click', () => el('fileUploadDialog').close());
    el('fileUploadForm').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      el('fileUploadStatus').textContent = 'Uploading…';
      try {
        const id = await StudyHubAdmin.upload(courseId, course, form.elements.file.files[0], form.elements.title.value, form.elements.description.value);
        location.assign(`file.html?document=${encodeURIComponent(id)}&course=${encodeURIComponent(courseId)}`);
      } catch (error) { el('fileUploadStatus').textContent = error.message; }
      finally { button.disabled = false; }
    });
    el('adminDelete').addEventListener('click', async () => {
      if (busy || !confirm(`Delete "${el('fileTitle').textContent}"?`)) return;
      el('adminDelete').disabled = true;
      try {
        await StudyHubAdmin.remove(courseId, documentId);
        location.assign(courseId === 'ctdl' ? 'dsa.html' : 'uit-is-cttt-subjects.html');
      } catch (error) { setStatus(error.message, true); el('adminDelete').disabled = false; }
    });
  }
  function setStatus(message, error = false) {
    el('fileStatus').textContent = message;
    el('fileStatus').classList.toggle('is-error', error);
  }
  function setBusy(value) {
    busy = value;
    main.setAttribute('aria-busy', String(value));
    el('retryDocument').disabled = value;
  }
  function heading(data) {
    const title = data?.title || sample?.title || 'Tài liệu';
    el('fileTitle').textContent = title;
    document.title = `VNU - StudyHub | ${title}`;
    el('fileDescription').textContent = data?.description || sample?.description || 'Tài liệu từ nguồn đã kết nối.';
    el('fileType').textContent = data?.type || sample?.type || 'FILE';
    el('fileMaster').hidden = !(data?.master ?? sample?.master);
    const metadata = [];
    if (data?.lecturer) metadata.push(`${icon('fa-regular fa-user')}GV: ${escape(data.lecturer)}`);
    if (data?.updated) {
      const date = /^\d{4}-\d{2}-\d{2}/.test(data.updated) ? StudyHub.date(data.updated.slice(0, 10)) : data.updated;
      metadata.push(`${icon('fa-regular fa-calendar-days')}Cập nhật: ${escape(date)}`);
    }
    if (data?.size) metadata.push(`${icon('fa-regular fa-hard-drive')}${escape(data.size)}`);
    if (data?.views) metadata.push(`${icon('fa-regular fa-eye')}${escape(data.views)} lượt xem`);
    el('fileMetadata').innerHTML = metadata.map(item => `<span>${item}</span>`).join('');
    const courseTitle = data?.courseTitle || course?.title;
    const crumbs = [...path];
    if (courseTitle) crumbs.push({ label: courseTitle, href: (data?.courseId || courseId) === 'ctdl' ? 'dsa.html' : 'uit-is-cttt-subjects.html' });
    crumbs.push({ label: 'Tài liệu' });
    el('fileBreadcrumb').innerHTML = breadcrumbs(crumbs);
  }
  function showPreview(pdfUrl, originalUrl, filename) {
    const iframe = el('pdfViewer');
    iframe.hidden = !pdfUrl;
    if (pdfUrl) {
      const url = new URL(pdfUrl);
      url.hash = 'toolbar=1&navpanes=1&view=FitH';
      iframe.src = url.href;
    } else {
      iframe.removeAttribute('src');
    }
    el('fileEmpty').hidden = Boolean(pdfUrl);
    el('openFile').hidden = !originalUrl;
    if (originalUrl) el('openFile').href = originalUrl;
    else el('openFile').removeAttribute('href');
    el('fileSource').textContent = filename || 'Tài liệu';
    el('fileEmptyTitle').textContent = originalUrl ? 'Tệp này chưa có bản xem PDF' : 'Chưa có tệp để hiển thị';
    el('fileEmptyMessage').textContent = originalUrl
      ? 'Bạn có thể mở tệp gốc. Bản xem Word, PowerPoint và Excel sẽ xuất hiện khi nguồn tài liệu cung cấp bản PDF.'
      : 'Tài liệu sẽ được hiển thị khi nguồn đã kết nối cung cấp đường dẫn tệp.';
  }
  function showRecord(data) {
    heading(data);
    const isPdf = data.mimeType === 'application/pdf' || data.type === 'PDF';
    showPreview(data.previewUrl || (isPdf ? data.fileUrl : null), data.fileUrl, data.title);
  }
  async function load() {
    if (busy) return;
    if (!documentId) {
      setStatus('Chưa chọn tài liệu. Hãy mở tài liệu từ danh sách môn học.', true);
      return;
    }
    setBusy(true);
    setStatus('Đang tải tài liệu...');
    try {
      let local;
      try { local = await StudyHubAdmin.get(documentId); }
      catch (error) { if (documentId.startsWith('local-')) throw error; }
      if (local?.deleted) throw new Error('This document has been deleted from this browser.');
      const localUrl = local?.blob ? URL.createObjectURL(local.blob) : null;
      if (localUrl) window.addEventListener('pagehide', () => URL.revokeObjectURL(localUrl), { once: true });
      const data = localUrl ? { ...local, fileUrl: localUrl } : await api.get(documentId);
      showRecord(data);
      setStatus(data.fileUrl || data.previewUrl ? 'Đã tải tài liệu từ nguồn đã kết nối.' : 'Tài liệu chưa có tệp đính kèm từ nguồn đã kết nối.');
    } catch (error) {
      setStatus(error.message, config.enabled);
    } finally {
      setBusy(false);
    }
  }
  el('retryDocument').addEventListener('click', load);
  heading(null);
  el('retryDocument').hidden = !config.enabled || !documentId;
  await load();
})();
