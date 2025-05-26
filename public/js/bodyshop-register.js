document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const phoneInput = document.getElementById("phone");
    const phoneError = document.getElementById("phone-error");
  
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const passwordError = document.getElementById("password-error");
  
    form.addEventListener("submit", (e) => {
      let valid = true;
  
      // Phone Validation
      const phoneRegex = /^07\d{9}$/;
      if (!phoneRegex.test(phoneInput.value)) {
        phoneError.textContent = "Enter a valid UK mobile number (07...)";
        phoneError.style.display = "block";
        valid = false;
      } else {
        phoneError.textContent = "";
        phoneError.style.display = "none";
      }
  
      // Password Match
      if (password.value !== confirmPassword.value) {
        passwordError.textContent = "Passwords do not match";
        passwordError.style.display = "block";
        valid = false;
      } else {
        passwordError.textContent = "";
        passwordError.style.display = "none";
      }
  
      if (!valid) e.preventDefault();
    });
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
  }