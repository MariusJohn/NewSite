// public/js/navbar-toggle.js
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");

  if (!burger || !navLinks) return;

  burger.addEventListener("click", () => {
    navLinks.classList.toggle("mobile-open");
  });
});

// Password visibility toggle (unchanged)
function togglePasswordVisibility(element) {
  const input = element.previousElementSibling;
  if (input.type === "password") {
    input.type = "text";
    element.textContent = "🙈";
  } else {
    input.type = "password";
    element.textContent = "👁️";
  }
}
