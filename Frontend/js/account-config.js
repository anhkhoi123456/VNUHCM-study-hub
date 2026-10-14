// The local Backend/server.py provides this authenticated endpoint.
// POST JSON { currentPassword, newPassword }; 2xx indicates success.
window.StudyHubAccountApi = { enabled: false, passwordEndpoint: '/api/account/password' };
