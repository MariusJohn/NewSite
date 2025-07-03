document.addEventListener("DOMContentLoaded", () => {

  console.log("✅ bodyshop-register.js loaded");


  const form = document.getElementById("registerForm");
  if (!form) return;

  const phoneInput = document.getElementById("phone");
  const phoneError = document.getElementById("phone-error");

  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");
  const passwordError = document.getElementById("password-error");

  // === Phone Validation (live as user types)
  const phoneRegex = /^(07\d{9}|01\d{8,9}|02\d{8,9}|03\d{8,9})$/;
  phoneInput.addEventListener("input", () => {
    const phone = phoneInput.value.replace(/\s+/g, ''); // remove spaces
    if (!phoneRegex.test(phone)) {
      phoneError.textContent = "Enter a valid UK mobile (07...) or landline (01/02/03...) number";
      phoneError.style.display = "block";
    } else {
      phoneError.textContent = "";
      phoneError.style.display = "none";
    }
  });

  // === Password Match Validation
  confirmInput.addEventListener("input", () => {
    if (passwordInput.value !== confirmInput.value) {
      passwordError.textContent = "Passwords do not match";
      passwordError.style.display = "block";
    } else {
      passwordError.textContent = "";
      passwordError.style.display = "none";
    }
  });

  // === Submit Validation (failsafe)
  form.addEventListener("submit", (e) => {
    let valid = true;

    const phone = phoneInput.value.replace(/\s+/g, '');
    if (!phoneRegex.test(phone)) {
      phoneError.textContent = "Enter a valid UK mobile or landline number.";
      phoneError.style.display = "block";
      valid = false;
    }

    if (passwordInput.value !== confirmInput.value) {
      passwordError.textContent = "Passwords do not match";
      passwordError.style.display = "block";
      valid = false;
    }

    if (!valid) e.preventDefault(); // block form submission
  });

document.querySelectorAll(".password-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const input = toggle.previousElementSibling;
    if (input.type === "password") {
      input.type = "text";
      toggle.textContent = "🙈";
    } else {
      input.type = "password";
      toggle.textContent = "👁️";
    }
  });
});



});

