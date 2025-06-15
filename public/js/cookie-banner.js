document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ Cookie banner script running");

  const cookieBanner = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('accept-cookies');

  console.log("cookieBanner:", cookieBanner);
  console.log("acceptBtn:", acceptBtn);

  if (!cookieBanner || !acceptBtn) return;

  if (!localStorage.getItem('cookiesAccepted')) {
    cookieBanner.classList.remove('hidden');
  }

  acceptBtn.addEventListener('click', () => {
    cookieBanner.classList.add('hidden');
    localStorage.setItem('cookiesAccepted', 'true');
  });
});
