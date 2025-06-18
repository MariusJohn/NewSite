document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const banner = document.getElementById('cookie-banner');
    const accept = document.getElementById('accept-cookies');
    if (!banner || !accept) return;

    if (!localStorage.getItem('cookiesAccepted')) {
      banner.classList.remove('hidden');
    }

    accept.addEventListener('click', () => {
      localStorage.setItem('cookiesAccepted', 'true');
      banner.classList.add('hidden');
    });
  }, 100); // Small delay for safety
});
