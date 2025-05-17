// test-quote-links.js
const { Job, Quote } = require('./models');

(async () => {
    try {
        const jobs = await Job.findAll({
            include: [{
                model: Quote,
                as: 'Quotes'  // Match the alias exactly
            }]
        });

        jobs.forEach(job => {
            console.log(`Job ID: ${job.id} - Quotes Received: ${job.Quotes.length}`);
        });
    } catch (error) {
        console.error("Error testing quote links:", error);
    }
})();