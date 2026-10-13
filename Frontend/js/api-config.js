/** Enable after implementing the API contract in README.md. */
window.StudyHubApiConfig = {
  enabled: false,
  baseUrl: '/api',
  credentials: 'same-origin',
  timeoutMs: 30000,
  endpoints: {
    document: id => `/documents/${encodeURIComponent(id)}`
  }
};
