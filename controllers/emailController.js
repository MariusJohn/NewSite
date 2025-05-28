// controllers/emailController.js
import { sendHtmlMail } from '../utils/sendMail.js';

export async function sendFinalEmails(job, quote) {
  const customerHtml = `
    <p>Hi ${job.customerName},</p>
    <p>You selected the following bodyshop for your vehicle repair:</p>
    <ul>
      <li><strong>Bodyshop:</strong> ${quote.bodyshop.name}</li>
      <li><strong>Email:</strong> ${quote.bodyshop.email}</li>
      <li><strong>Phone:</strong> ${quote.bodyshop.phone}</li>
      <li><strong>Quote:</strong> £${quote.price}</li>
    </ul>
    <p>Please contact them if they don’t reach out within 24 hours.</p>
    <p>– MC Quote Team</p>
  `;

  const bodyshopHtml = `
    <p>Hello ${quote.bodyshop.name},</p>
    <p>A customer has selected your quote for vehicle repair:</p>
    <ul>
      <li><strong>Customer:</strong> ${job.customerName}</li>
      <li><strong>Email:</strong> ${job.customerEmail}</li>
      <li><strong>Phone:</strong> ${job.customerPhone}</li>
      <li><strong>Location:</strong> ${job.location}</li>
      <li><strong>Quote:</strong> £${quote.price}</li>
    </ul>
    <p>Please reach out to the customer within 24 hours.</p>
    <p>– MC Quote System</p>
  `;

  await sendHtmlMail(job.customerEmail, 'Repair Bodyshop Selected', customerHtml);
  await sendHtmlMail(quote.bodyshop.email, 'New Customer Assigned', bodyshopHtml);
}


