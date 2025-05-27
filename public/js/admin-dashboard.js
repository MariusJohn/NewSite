// public/js/admin-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const jobRows = document.querySelectorAll('.job-row');

    jobRows.forEach(row => {
        row.addEventListener('click', () => {
            const jobId = row.dataset.jobId;
            const detailsRow = document.querySelector(`.quote-details-row[data-job-id="${jobId}"]`);
            const toggleIcon = row.querySelector('.toggle-icon');

            if (detailsRow) {
                if (detailsRow.style.display === 'none') {
                    detailsRow.style.display = 'table-row';
                    if (toggleIcon) toggleIcon.textContent = '-';
                } else {
                    detailsRow.style.display = 'none';
                    if (toggleIcon) toggleIcon.textContent = '+';
                }
            }
        });
    });
});