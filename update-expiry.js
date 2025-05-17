// update-expiry.js
const { Job } = require('./models');

(async () => {
    try {
        const jobs = await Job.findAll({
            where: {
                quoteExpiry: null,
                status: 'approved'
            }
        });

        for (const job of jobs) {
            job.quoteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
            await job.save();
            console.log(`Updated Job ID ${job.id} with quoteExpiry: ${job.quoteExpiry}`);
        }

        console.log("Expiry dates updated successfully.");
    } catch (error) {
        console.error("Error updating expiry dates:", error);
    }
})();