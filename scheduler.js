// scheduler.js
const cron = require('node-cron');
const { Job, Quote, Bodyshop } = require('./models');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
require('dotenv').config();

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
transporter.verify(function (error, success) {
    if (error) {
        console.error("Email connection failed:", error);
    } else {
        console.log("Email server is ready to take messages");
    }
});

// Schedule the reminder to run every hour
cron.schedule('0 * * * *', async () => {
    console.log("Running scheduled job for quote reminders...");

    try {
        // Find all jobs with at least one quote older than 24 hours
// TEMPORARY: Find all jobs with at least one quote older than 1 minute
const jobs = await Job.findAll({
    include: {
        model: Quote,
        where: {
            createdAt: {
                [Op.lte]: new Date(Date.now() - 60 * 1000) // 1 minute
            }
        },
        required: true
    }
});

        console.log(`Found ${jobs.length} jobs with quotes older than 24 hours.`);

        for (const job of jobs) {
            console.log(`Processing Job ID: ${job.id}, Location: ${job.location}`);

            // Find bodyshops in the same area that haven't quoted yet
            const nearbyBodyshops = await Bodyshop.findAll({
                where: {
                    area: job.location,
                    lastReminderSent: {
                        [Op.or]: [
                            null,
                            {
                                [Op.lte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
                            }
                        ]
                    }
                }
            });

            console.log(`Found ${nearbyBodyshops.length} bodyshops in the area without recent reminders.`);

            for (const bodyshop of nearbyBodyshops) {
                // Send reminder email
                const mailOptions = {
                    from: `"MC Quote" <${process.env.EMAIL_USER}>`,
                    to: bodyshop.email,
                    subject: `New Quote Opportunity for Job #${job.id}`,
                    text: `A new quote has been submitted in your area for Job #${job.id}. Please visit your dashboard to submit your quote.`
                };

                try {
                    await transporter.sendMail(mailOptions);
                    console.log(`Reminder sent to: ${bodyshop.email}`);

                    // Update the last reminder timestamp
                    bodyshop.lastReminderSent = new Date();
                    await bodyshop.save();
                } catch (emailError) {
                    console.error(`Failed to send email to ${bodyshop.email}:`, emailError);
                }
            }
        }

        console.log("Hourly reminders processed.");
    } catch (error) {
        console.error("Error sending reminders:", error);
    }
});