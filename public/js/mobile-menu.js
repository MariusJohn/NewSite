// public/js/mobile-menu.js

document.addEventListener("DOMContentLoaded", () => {
    const burger = document.getElementById("burger");
    const navLinks = document.getElementById("navLinks");
  
    if (!burger || !navLinks) return;
  
    burger.addEventListener("click", () => {
      
      navLinks.classList.toggle("mobile-open");
    });
  });
  