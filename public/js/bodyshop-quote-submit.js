document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.quote-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const jobId = form.getAttribute('data-job-id');
      const price = form.querySelector('input[name="price"]').value;
      const note = form.querySelector('input[name="note"]').value;

      const res = await fetch(`/bodyshop/quote/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': form.querySelector('input[name="_csrf"]').value
        },
        body: JSON.stringify({ price, note })
      });

      const data = await res.json();

      if (data.success) {
        alert("Quote submitted!");
      } else {
        alert("Failed to submit quote.");
      }
    });
  });
});
