/** Read-only API boundary for backend document metadata and file URLs. */
window.StudyHubDocumentsApi = (() => {
  const config = StudyHubApiConfig;
  function safeUrl(value) {
    if (!value) return null;
    const base = new URL(config.baseUrl.replace(/\/?$/, '/'), window.location.href);
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Đường dẫn tài liệu không hợp lệ.');
    return url.href;
  }
  function normalize(record) {
    if (!record || typeof record.id !== 'string' || !record.id || typeof record.title !== 'string') {
      throw new Error('Dữ liệu tài liệu từ máy chủ không hợp lệ.');
    }
    return {
      id: record.id, title: record.title, description: String(record.description || ''),
      courseId: String(record.courseId || ''), courseTitle: String(record.courseTitle || ''),
      type: String(record.type || 'FILE').toUpperCase(), mimeType: String(record.mimeType || ''),
      lecturer: String(record.lecturer || ''), updated: String(record.updated || ''),
      size: String(record.size || ''), views: String(record.views ?? ''), master: record.master === true,
      fileUrl: safeUrl(record.fileUrl), previewUrl: safeUrl(record.previewUrl)
    };
  }
  async function request(endpoint) {
    if (!config.enabled) throw new Error('Chưa kết nối nguồn tài liệu.');
    if (window.location.protocol === 'file:') throw new Error('Hãy mở website qua HTTP để kết nối nguồn tài liệu.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}${endpoint}`, {
        method: 'GET', credentials: config.credentials, signal: controller.signal, headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        const messages = { 401: 'Vui lòng đăng nhập để truy cập tài liệu.', 403: 'Bạn không có quyền truy cập tài liệu này.', 404: 'Không tìm thấy tài liệu.' };
        throw new Error(messages[response.status] || `Không thể xử lý tài liệu (${response.status}).`);
      }
      return normalize(await response.json());
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Kết nối quá thời gian chờ. Vui lòng thử lại.');
      if (error instanceof TypeError) throw new Error('Không thể kết nối nguồn tài liệu. Vui lòng thử lại.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  return { get: id => request(config.endpoints.document(id)), normalize };
})();
