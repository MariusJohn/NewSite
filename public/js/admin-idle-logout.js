// admin-idle-logout.js

const maxIdleTimeMinutes = 15;
let idleTimeout;

const resetIdleTimer = () => {
  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(() => {
    alert('Session expired due to inactivity. You will be logged out.');
    window.location.href = '/admin/logout';
  }, maxIdleTimeMinutes * 60 * 1000);
};

// Set up initial timer
resetIdleTimer();

// Reset timer on user activity
['mousemove', 'keydown', 'scroll', 'click'].forEach(evt =>
  window.addEventListener(evt, resetIdleTimer)
);

// Attempt logout on tab close
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon('/admin/logout');
});
