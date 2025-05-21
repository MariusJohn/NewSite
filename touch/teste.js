// scheduler.js
import cron from 'node-cron';      // Changed: const cron = require('node-cron');
import { Job, Quote, Bodyshop } from './models/index.js'; // Changed: const { Job, Quote, Bodyshop } = require('./models'); - Added /index.js and .js
import nodemailer from 'nodemailer'; // Changed: const nodemailer = require('nodemailer');
import { Op } from 'sequelize';     // Changed: const { Op } = require('sequelize');

import dotenv from 'dotenv';      // Changed: require('dotenv').config();
dotenv.config();                  // Changed: require('dotenv').config(); is now dotenv.config();

// Email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify the connection
transporter.verify((error) => {
    if (error) {
        console.error("Email connection failed:", error);
    }
});

// Schedule the reminder to run every hour
cron.schedule('0 * * * *', async () => {
    try {
        const now = new Date();
        const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);  // 24 hours ago
        const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);  // 48 hours ago

        // Find all jobs that are still open for quotes but are nearing the 48-hour limit
        const jobs = await Job.findAll({
            where: {
                status: 'approved',
                quoteExpiry: {
                    [Op.gt]: now
                }
            },
            include: [{
                model: Quote,
                as: 'Quotes'
            }]
        });

        for (const job of jobs) {
            const quoteCount = job.Quotes ? job.Quotes.length : 0; // Correctly get quote count
            const bodyshopsInRange = await Bodyshop.count({ where: { location: job.location } }); // Assuming 'location' field for Bodyshop area
            const remainingBodyshops = bodyshopsInRange - quoteCount;

            // 24-hour reminder logic
            // Check if 24 hours have passed since creation AND it hasn't been extended yet
            if (job.createdAt <= cutoff24h && !job.extensionRequestedAt) { // Changed job.extended to job.extensionRequestedAt
                if (quoteCount === 0) {
                    // No quotes, send final 24-hour reminder
                    await sendCustomerNoQuotesEmail(job);
                } else if (quoteCount === 1) {
                    // 1 quote available, ask if they want to wait
                    await sendCustomerSingleQuoteEmail(job, remainingBodyshops);
                } else if (quoteCount === 2) {
                    // 2 quotes available, ask if they want to wait
                    await sendCustomerMultipleQuotesEmail(job, remainingBodyshops);
                } else if (quoteCount > 2) {
                    // 3+ quotes, direct to payment
                    await sendCustomerPaymentEmail(job);
                }

                // Mark as extension requested to avoid repeat reminders
                job.extensionRequestedAt = now; // Set the timestamp
                // job.extended = true; // No need for separate boolean if timestamp indicates
                await job.save();
            }

            // 48-hour expiry logic
            // Check if 48 hours have passed since creation
            if (job.createdAt <= cutoff48h) {
                if (quoteCount === 0) {
                    // Delete job if no quotes after 48 hours
                    await sendCustomerJobDeletedEmail(job);
                    await job.destroy(); // Permanently delete
                } else {
                    // Direct to payment if at least 1 quote is available
                    await sendCustomerPaymentEmail(job);
                }
            }
        }

    } catch (error) {
        console.error("Error in scheduler:", error);
    }
});

// Helper functions for customer emails (no changes needed here for ES conversion, but I've included them for completeness)
async function sendCustomerNoQuotesEmail(job) {
    const mailOptions = {
        from: `"MC Quote" <${process.env.EMAIL_USER}>`,
        to: job.customerEmail,
        subject: `Your Job #${job.id} - No Quotes Available`,
        text: `Unfortunately, no bodyshops have provided quotes for your job #${job.id} within 24 hours. You can choose to extend the job for another 24 hours or let it expire. Reply YES to extend or NO to delete the job.`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (emailError) {
        console.error(`Failed to send no quotes email for Job ID ${job.id}:`, emailError);
    }
}

async function sendCustomerSingleQuoteEmail(job, remainingBodyshops) {
    const mailOptions = {
        from: `"MC Quote" <${process.env.EMAIL_USER}>`,
        to: job.customerEmail,
        subject: `Your Job #${job.id} - 1 Quote Available`,
        text: `Your job #${job.id} has received 1 quote within the first 24 hours. There are still ${remainingBodyshops} bodyshops that have not responded. Would you like to extend the job for another 24 hours? Reply YES to extend or NO to proceed to payment.`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (emailError) {
        console.error(`Failed to send single quote email for Job ID ${job.id}:`, emailError);
    }
}

async function sendCustomerMultipleQuotesEmail(job, remainingBodyshops) {
    const mailOptions = {
        from: `"MC Quote" <${process.env.EMAIL_USER}>`,
        to: job.customerEmail,
        subject: `Your Job #${job.id} - Multiple Quotes Available`,
        text: `Your job #${job.id} has received 2 quotes within the first 24 hours. There are still ${remainingBodyshops} bodyshops that have not responded. Would you like to extend the job for another 24 hours to potentially receive more quotes? Reply YES to extend or NO to proceed to payment.`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (emailError) {
        console.error(`Failed to send multiple quotes email for Job ID ${job.id}:`, emailError);
    }
}

async function sendCustomerPaymentEmail(job) {
    const mailOptions = {
        from: `"MC Quote" <${process.env.EMAIL_USER}>`,
        to: job.customerEmail,
        subject: `Your Job #${job.id} - Proceed to Payment`,
        text: `Your job #${job.id} has received enough quotes. Please proceed to the payment page to unlock the details of the bodyshops that have quoted.`
    };

    try {
        await transporter.sendMail(mailOptions);
        job.status = 'pending_payment'; // Update job status
        await job.save();
    } catch (emailError) {
        console.error(`Failed to send payment email for Job ID ${job.id}:`, emailError);
    }
}

async function sendCustomerJobDeletedEmail(job) {
    const mailOptions = {
        from: `"MC Quote" <${process.env.EMAIL_USER}>`,
        to: job.customerEmail,
        subject: `Your Job #${job.id} - Job Deleted`,
        text: `Your job #${job.id} has expired and has been automatically deleted as no quotes were received within 48 hours.`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (emailError) {
        console.error(`Failed to send job deleted email for Job ID ${job.id}:`, emailError);
    }
}