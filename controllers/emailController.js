import sendMail from '../utils/sendMail.js'; 

export async function sendFinalEmails(job, quote) {
  const customerMsg = `
    Hi ${job.customerName},

    You selected the following bodyshop for your vehicle repair:

    Bodyshop: ${quote.bodyshop.name}
    Email: ${quote.bodyshop.email}
    Phone: ${quote.bodyshop.phone}
    Quote: £${quote.price}

    Please contact them if they don't reach out within 24 hours.

    – MC Quote Team
  `;

  const bodyshopMsg = `
    Hello ${quote.bodyshop.name},

    A new customer has selected you for repair.

    Customer: ${job.customerName}
    Email: ${job.customerEmail}
    Phone: ${job.customerPhone}
    Location: ${job.location}
    Quote Amount: £${quote.price}

    Please reach out to the customer within 24 hours.

    – MC Quote System
  `;

  await sendMail(job.customerEmail, 'Repair Bodyshop Selected', customerMsg);
  await sendMail(quote.bodyshop.email, 'New Customer Assigned', bodyshopMsg);
}
