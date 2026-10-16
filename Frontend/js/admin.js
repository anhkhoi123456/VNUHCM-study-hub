/** Browser-local demo roles and documents. These never grant server permissions. */
window.StudyHubAdmin = (() => {
  function isAdmin() {
    try { return JSON.parse(sessionStorage.getItem('studyhub-session'))?.role === 'admin'; }
    catch { return false; }
  }
  function database() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('studyhub-local-documents', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('documents', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Browser document storage is unavailable.'));
    });
  }
  async function operation(mode, action) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('documents', mode);
      const request = action(transaction.objectStore('documents'));
      transaction.oncomplete = () => { db.close(); resolve(request.result); };
      transaction.onabort = transaction.onerror = () => { db.close(); reject(new Error('Could not save document changes. Browser storage may be full.')); };
    });
  }
  const all = () => operation('readonly', store => store.getAll());
  const get = id => operation('readonly', store => store.get(id));
  async function save(record) {
    if (!isAdmin()) throw new Error('Sign in as Admin to manage documents.');
    return operation('readwrite', store => store.put(record));
  }
  async function merge(courseId, documents) {
    const records = (await all()).filter(record => record.courseId === courseId);
    const overrides = new Set(records.map(record => record.id));
    return [...documents.filter(doc => !overrides.has(doc.id)), ...records.filter(doc => !doc.deleted)];
  }
  async function upload(courseId, course, file, title, description) {
    const type = file.name.split('.').pop().toUpperCase();
    const mimeTypes = { PDF: 'application/pdf', PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    if (!mimeTypes[type] || !file.size || file.size > 20 * 1024 * 1024) throw new Error('Choose a PDF, PPTX, DOCX or XLSX file between 1 byte and 20 MB.');
    const now = new Date();
    const record = { id: `local-${crypto.randomUUID()}`, courseId, courseTitle: course.title,
      title: title.trim() || file.name, description: description.trim(), lecturer: course.lecturer,
      updated: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      type, mimeType: mimeTypes[type], size: `${(file.size / 1024 / 1024).toFixed(2)} MB`, views: '0',
      blob: new Blob([file], { type: mimeTypes[type] }) };
    await save(record);
    return record.id;
  }
  return { isAdmin, merge, get, upload, remove: (courseId, id) => save({ id, courseId, deleted: true }) };
})();
