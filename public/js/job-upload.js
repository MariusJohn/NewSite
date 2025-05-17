document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("uploadForm");
    if (!form) return; 

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("telephone");
    const postcodeInput = document.getElementById("location");
    const imagesInput = document.getElementById("images");
    
    const nameError = document.getElementById("name-error");
    const emailError = document.getElementById("email-error");
    const phoneError = document.getElementById("phone-error");
    const postcodeError = document.getElementById("postcode-error");
    const imagesError = document.getElementById("images-error");
    const formError = document.getElementById("form-error-message");

    const MAX_FILE_SIZE_MB = 8;
    const MIN_IMAGES = 5;
    const MAX_IMAGES = 8;

    // Name Validation
    nameInput.addEventListener("input", function() {
        if (nameInput.value.trim().length < 3) {
            showError(nameError, "Full name must be at least 3 characters long.");
        } else {
            clearError(nameError);
        }
    });

    // Email Validation
    emailInput.addEventListener("input", function() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailInput.value.trim())) {
            showError(emailError, "Please enter a valid email address.");
        } else {
            clearError(emailError);
        }
    });

    // Phone Number Validation
    phoneInput.addEventListener("input", function() {
        const phonePattern = /^07\d{9}$/;
        if (!phonePattern.test(phoneInput.value.trim())) {
            showError(phoneError, "Please enter a valid UK phone number (07...).");
        } else {
            clearError(phoneError);
        }
    });

    // Postcode Validation
    postcodeInput.addEventListener("input", function() {
        const postcodePattern = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
        if (!postcodePattern.test(postcodeInput.value.trim())) {
            showError(postcodeError, "Please enter a valid UK postcode.");
        } else {
            clearError(postcodeError);
        }
    });

    // Image Validation
    imagesInput.addEventListener("change", function() {
        const files = imagesInput.files;

        if (files.length < MIN_IMAGES || files.length > MAX_IMAGES) {
            showError(imagesError, `Please upload between ${MIN_IMAGES} to ${MAX_IMAGES} images.`);
            return;
        }

        for (const file of files) {
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > MAX_FILE_SIZE_MB) {
                showError(imagesError, `Each image must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
                return;
            }
        }

        clearError(imagesError);
    });

    // Form Submission Check
    form.addEventListener("submit", function(event) {
        if (nameError.textContent || emailError.textContent || phoneError.textContent || postcodeError.textContent || imagesError.textContent) {
            event.preventDefault();
            showError(formError, "Please correct the highlighted errors before submitting.");
        } else {
            clearError(formError);
        }
    });

    // Show error message
    function showError(element, message) {
        element.textContent = message;
        element.style.display = "block";
    }

    // Clear error message
    function clearError(element) {
        element.textContent = "";
        element.style.display = "none";
    }
});