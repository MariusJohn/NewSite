if (job.quotes.length >= 1 && hoursSinceUpload >= 3) {
    sendEmailToCustomer(job);
  }

  const quotes = await Quote.findAll({ where: { jobId } });
console.log(`Quotes found for job ${jobId}:`, quotes.length);