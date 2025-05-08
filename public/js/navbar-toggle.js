document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector(".mobile-menu-btn");
  const navbar = document.querySelector(".navbar");

  if (toggleBtn && navbar) {
    toggleBtn.addEventListener("click", () => {
      navbar.classList.toggle("mobile-menu-open");
    });
  }
});


function togglePasswordVisibility(element) {
    const input = element.previousElementSibling;
    if (input.type === "password") {
        input.type = "text";
        element.textContent = "🙈";
    } else {
        input.type = "password";
        element.textContent = "👁️";
    }
};
