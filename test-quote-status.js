// test-quote-status.js
const { Quote, Job } = require('./models');

(async () => {
    try {
        // Create a new quote
        const quote = await Quote.create({
            bodyshopId: 8, // Replace with a valid bodyshop ID
            jobId: 11, // Replace with a valid job ID
            price: 300.00,
            notes: "Automated Test Quote",
            email: "test@example.com"
        });

        console.log("Quote created:", quote);

        // Check the job status
        const job = await Job.findByPk(11);
        console.log(`Job ID: ${job.id} - Quotes Received: ${job.quoteCount} - Status: ${job.quoteStatus}`);

    } catch (error) {
        console.error("Error testing quote status:", error);
    }
})();