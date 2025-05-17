// test-job-status.js
const { Job, Quote } = require('./models');
const { Op } = require('sequelize');
require('dotenv').config();

(async () => {
    try {
        const jobs = await Job.findAll({
            include: [{ model: Quote }]
        });

        jobs.forEach((job) => {
            console.log(`Job ID: ${job.id}`);
            console.log(`Status: ${job.status}`);
            console.log(`Quote Status: ${job.quoteStatus}`);
            console.log(`Quotes Received: ${job.Quotes.length}`);
            console.log(`Created At: ${job.createdAt}`);
            console.log(`Quote Expiry: ${job.quoteExpiry}`);
            console.log(`Extended: ${job.extended}`);
            console.log(`Extension Requested At: ${job.extensionRequestedAt}`);
            console.log(`Customer Decision: ${job.customerDecision}`);
            console.log(`-----------------------------------`);
        });
    } catch (error) {
        console.error("Error fetching job data:", error);
    }
})();