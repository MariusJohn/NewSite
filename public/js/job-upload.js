document.addEventListener("DOMContentLoaded", function () {
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

  const showBtn = document.getElementById("showInstructionsBtn");
  const modal = document.getElementById("uploadInstructionsModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const feedback = document.getElementById("images-feedback");
  const previewContainer = document.getElementById("preview-container");

  const MAX_FILE_SIZE_MB = 8;
  const MIN_IMAGES = 5;
  const MAX_IMAGES = 8;

  // === Open Instructions Modal ===
  showBtn?.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // === Close Modal and trigger file picker (gallery-only) ===
closeModalBtn?.addEventListener("click", () => {
  modal.style.display = "none";
  setTimeout(() => {
    imagesInput.click(); // will now open gallery
  }, 200);
});


  // === Input Validations ===
  nameInput.addEventListener("input", () => {
    nameInput.value.trim().length < 3
      ? showError(nameError, "Full name must be at least 3 characters long.")
      : clearError(nameError);
  });

  emailInput.addEventListener("input", () => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    !pattern.test(emailInput.value.trim())
      ? showError(emailError, "Please enter a valid email address.")
      : clearError(emailError);
  });

  phoneInput.addEventListener("input", () => {
    const pattern = /^07\d{9}$/;
    !pattern.test(phoneInput.value.trim())
      ? showError(phoneError, "Please enter a valid UK phone number (07...).")
      : clearError(phoneError);
  });

  postcodeInput.addEventListener("input", () => {
    const pattern = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
    !pattern.test(postcodeInput.value.trim())
      ? showError(postcodeError, "Please enter a valid UK postcode.")
      : clearError(postcodeError);
  });

  // === Image Preview & Validation ===
  imagesInput.addEventListener("change", () => {
    const files = imagesInput.files;
    previewContainer.innerHTML = "";
    feedback.textContent = "";

    if (files.length < MIN_IMAGES || files.length > MAX_IMAGES) {
      return showError(imagesError, `Please upload between ${MIN_IMAGES} to ${MAX_IMAGES} images.`);
    }

    for (const file of files) {
      if (file.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
        return showError(imagesError, `Each image must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.width = "80px";
        img.style.borderRadius = "6px";
        img.style.marginRight = "8px";
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    }

    clearError(imagesError);
    feedback.textContent = `${files.length} image${files.length === 1 ? "" : "s"} selected.`;
  });

  // === Image Compression ===
  async function compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 1280;
          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          }, "image/jpeg", 0.7);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // === Final Submit ===
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (
      nameError.textContent ||
      emailError.textContent ||
      phoneError.textContent ||
      postcodeError.textContent ||
      imagesError.textContent
    ) {
      return showError(formError, "Please correct the highlighted errors before submitting.");
    }

    clearError(formError);

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";
    submitBtn.style.opacity = 0.7;

    const files = Array.from(imagesInput.files);
    const compressedFiles = await Promise.all(files.map(compressImage));

    const formData = new FormData();
    formData.append("customerName", nameInput.value.trim());
    formData.append("email", emailInput.value.trim());
    formData.append("telephone", phoneInput.value.trim());
    formData.append("postcode", postcodeInput.value.trim());
    formData.append("description", document.getElementById("description")?.value || "");
    formData.append("_csrf", document.querySelector('[name="_csrf"]').value);
    formData.append("g-recaptcha-response", grecaptcha.getResponse());

    compressedFiles.forEach((file, i) => {
      formData.append("images", file, `upload-${i}.jpg`);
    });

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else {
        const text = await response.text();
        document.open();
        document.write(text);
        document.close();
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
      showError(formError, "An error occurred during upload. Please try again.");
    }
  });

  // === Error Helpers ===
  function showError(element, message) {
    element.textContent = message;
    element.style.display = "block";
  }

  function clearError(element) {
    element.textContent = "";
    element.style.display = "none";
  }
});
