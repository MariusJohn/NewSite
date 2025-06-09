// public/js/cookie-banner.js
document.addEventListener('DOMContentLoaded', () => {
  const banner = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('accept-cookies');

  // Show only if not already accepted this session
  if (!sessionStorage.getItem('cookieAccepted')) {
    banner.classList.remove('hidden');
  }

  acceptBtn.addEventListener('click', () => {
    sessionStorage.setItem('cookieAccepted', 'true'); // Auto-clears when browser closes
    banner.classList.add('hidden');
  });
});
