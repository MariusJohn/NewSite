document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("carousel-track");
  const cards = track.children;
  let index = 0;

  setInterval(() => {
    index = (index + 1) % cards.length;
    track.style.transform = `translateX(-${index * 100}%)`;
  }, 5000); // rotates every 5 seconds
});
