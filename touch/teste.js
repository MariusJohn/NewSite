if (!burger || !navLinks) return;
  
burger.addEventListener("click", () => {
  
  navLinks.classList.toggle("mobile-open");
});