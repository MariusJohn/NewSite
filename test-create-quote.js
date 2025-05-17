// test-create-quote.js
const { Quote } = require('./models');

(async () => {
    try {
        // Replace with a valid job ID and bodyshop ID
        const jobId = 11;
        const bodyshopId = 8;  // Use a valid bodyshop ID

        const quote = await Quote.create({
            jobId,
            bodyshopId,
            price: 250.00,
            notes: "Test quote from BODYSHOP B",
            email: "dorina.ciuclea2013@gmail.com"
        });

        console.log("Quote created:", quote);
    } catch (error) {
        console.error("Error creating quote:", error);
    }
})();