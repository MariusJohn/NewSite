// controllers/emailController.js
import { sendHtmlMail } from '../utils/sendMail.js';

export async function sendFinalEmails(job, quote) {
  const customerHtml = `
  <div style="font-family: Arial, sans-serif; color: #002f5c; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="<%= baseUrl %>/img/logo.svg" alt="My Car Quote Logo"style="height: 60px;" />
    </div>

    <h2 style="color: #002f5c;">Bodyshop Details Confirmed</h2>

    <p>Hi <strong>${job.customerName}</strong>,</p>

    <p>You selected the following bodyshop to carry out your vehicle repair:</p>

    <ul style="list-style: none; padding-left: 0;">
      <li><strong>🚗 Bodyshop:</strong> ${quote.bodyshop.name}</li>
      <li><strong>📧 Email:</strong> ${quote.bodyshop.email}</li>
      <li><strong>📞 Phone:</strong> ${quote.bodyshop.phone}</li>
      <li><strong>💷 Quote:</strong> £${quote.price}</li>
    </ul>

    <p>Please give them up to <strong>24 hours</strong> to get in touch. If you don’t hear back, we recommend reaching out directly using the details above.</p>

    <p style="margin-top: 30px;">– The <strong>My Car Quote</strong> Team</p>
  </div>
`;


const bodyshopHtml = `
  <div style="font-family: Arial, sans-serif; color: #002f5c; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="/img/logo-true.svg" alt="My Car Quote Logo" style="height: 60px;" />
    </div>

    <h2 style="color: #002f5c;">A Customer Selected Your Quote</h2>

    <p>Hello <strong>${quote.bodyshop.name}</strong>,</p>

    <p>A customer has selected your quote for vehicle repair. Here are their details:</p>

    <ul style="list-style: none; padding-left: 0;">
      <li><strong>👤 Customer:</strong> ${job.customerName}</li>
      <li><strong>📧 Email:</strong> ${job.customerEmail}</li>
      <li><strong>📞 Phone:</strong> ${job.customerPhone}</li>
      <li><strong>📍 Location:</strong> ${job.location}</li>
      <li><strong>💷 Quoted Price:</strong> £${quote.price}</li>
    </ul>

    <p>Please contact the customer within <strong>24 hours</strong> to arrange next steps.</p>

    <p style="margin-top: 30px;">– The <strong>My Car Quote</strong> System</p>
  </div>
`;


  await sendHtmlMail(job.customerEmail, 'Repair Bodyshop Selected', customerHtml);
  await sendHtmlMail(quote.bodyshop.email, 'New Customer Assigned', bodyshopHtml);
}


