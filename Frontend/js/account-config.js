// Enable only after providing an authenticated password-change endpoint.
// POST JSON { currentPassword, newPassword }; 2xx indicates success.
window.StudyHubAccountApi = { enabled: false, passwordEndpoint: '/api/account/password' };
