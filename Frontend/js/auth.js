/**
 * Firebase Authentication helper (SDK "compat" build, classic scripts). Does nothing unless
 * firebase-config.js has values and the page is served over http(s), so file:// previews and
 * unconfigured deployments keep the old behavior.
 */
window.StudyHubAuth = (() => {
  const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const config = window.StudyHubFirebaseConfig;
  const available = Boolean(config && config.apiKey && config.projectId) && /^https?:$/.test(window.location.protocol);
  let auth = null;
  let loading = null;

  function script(src) {
    return new Promise((resolve, reject) => {
      const element = document.createElement('script');
      element.src = src; element.async = false;
      element.onload = resolve;
      element.onerror = () => reject(new Error('Could not load the sign-in service.'));
      document.head.append(element);
    });
  }
  /** Loads the SDK once. Call early: signInWithPopup must run synchronously inside a click handler. */
  function load() {
    if (!available) return Promise.reject(new Error('Sign-in is not configured.'));
    loading ||= script(`${SDK}firebase-app-compat.js`).then(() => script(`${SDK}firebase-auth-compat.js`)).then(() => {
      if (!window.firebase.apps.length) window.firebase.initializeApp(config);
      auth = window.firebase.auth();
      return auth;
    }).catch(error => { loading = null; throw error; });
    return loading;
  }
  return {
    available,
    load,
    /** Starts loading in the background; errors surface later through load(). */
    preload() { if (available) load().catch(() => {}); },
    /** The Firebase auth instance once loaded, else null. */
    current: () => auth,
    async signOut() { if (available) await (await load()).signOut(); }
  };
})();
