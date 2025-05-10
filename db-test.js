// db-test.js
require('dotenv').config();
const { sequelize, Job, Quote, Bodyshop } = require('./models');

async function testDatabase() {
    try {
        console.log('🌐 Testing database connection...');

        // Test the connection
        await sequelize.authenticate();
        console.log('✅ Database connection successful.');

        // Test each model
        const jobs = await Job.findAll();
        const quotes = await Quote.findAll();
        const bodyshops = await Bodyshop.findAll();

        console.log(`📝 Found ${jobs.length} jobs, ${quotes.length} quotes, and ${bodyshops.length} bodyshops.`);

        // Print sample data
        console.log('Sample Job:', jobs[0] || 'No jobs found');
        console.log('Sample Quote:', quotes[0] || 'No quotes found');
        console.log('Sample Bodyshop:', bodyshops[0] || 'No bodyshops found');

        // Close the connection
        await sequelize.close();
        console.log('🔒 Database connection closed.');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
}

testDatabase();