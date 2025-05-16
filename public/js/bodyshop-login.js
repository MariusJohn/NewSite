document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('bodyshopEmail');
    const passwordInput = document.getElementById('password');
    const areaInput = document.getElementById('bodyshopArea');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const areaError = document.getElementById('area-error');
    const formErrorMessage = document.getElementById('form-error-message');

    // Function to validate UK postcode format (basic)
    function isValidUKPostcode(postcode) {
        if (!postcode) return true; // Allow empty for now, adjust if needed
        const postcodeRegex = /^([A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2})$/i;
        return postcodeRegex.test(postcode);
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Real-time validation on blur for email
    emailInput.addEventListener('blur', function() {
        if (!emailInput.value.trim()) {
            emailError.textContent = 'Please enter your email address.';
        } else if (!isValidEmail(emailInput.value.trim())) {
            emailError.textContent = 'Please enter a valid email address.';
        } else {
            emailError.textContent = '';
        }
    });

    // Real-time validation on blur for password
    passwordInput.addEventListener('blur', function() {
        if (!passwordInput.value) {
            passwordError.textContent = 'Please enter your password.';
        } else {
            passwordError.textContent = '';
        }
    });

    // Real-time validation on blur for postcode/area
    areaInput.addEventListener('blur', function() {
        if (!areaInput.value.trim()) {
            areaError.textContent = 'Please enter your postcode or area.';
        } else if (!isValidUKPostcode(areaInput.value.trim())) {
            areaError.textContent = 'Please enter a valid UK postcode format (e.g., SW1A 0AA).';
        } else {
            areaError.textContent = '';
        }
    });

    loginForm.addEventListener('submit', function(event) {
        let isValid = true;

        // Final validation on submit (in case user skips blur)
        if (!emailInput.value.trim()) {
            emailError.textContent = 'Please enter your email address.';
            isValid = false;
        } else if (!isValidEmail(emailInput.value.trim())) {
            emailError.textContent = 'Please enter a valid email address.';
            isValid = false;
        }

        if (!passwordInput.value) {
            passwordError.textContent = 'Please enter your password.';
            isValid = false;
        }

        if (!areaInput.value.trim()) {
            areaError.textContent = 'Please enter your postcode or area.';
            isValid = false;
        } else if (!isValidUKPostcode(areaInput.value.trim())) {
            areaError.textContent = 'Please enter a valid UK postcode format (e.g., SW1A 0AA).';
            isValid = false;
        }

        if (!isValid) {
            event.preventDefault(); // Prevent form submission if there are errors
        }
    });

    function togglePasswordVisibility(toggleSpan) {
        const passwordInput = toggleSpan.previousElementSibling;
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleSpan.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    }
});