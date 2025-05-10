// update-coordinates.js
const axios = require('axios');
const { Bodyshop } = require('./models');

async function updateMissingCoordinates() {
    const bodyshops = await Bodyshop.findAll({ where: { latitude: null, longitude: null } });
    const apiKey = process.env.OPENCAGE_API_KEY;

    for (const bodyshop of bodyshops) {
        try {
            const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
                params: {
                    q: bodyshop.area,
                    key: apiKey,
                    countrycode: 'gb',
                    limit: 1
                }
            });

            const { lat, lng } = response.data.results[0].geometry;
            bodyshop.latitude = lat;
            bodyshop.longitude = lng;
            await bodyshop.save();

            console.log(`Updated coordinates for ${bodyshop.name} (${bodyshop.area}): ${lat}, ${lng}`);
        } catch (err) {
            console.error(`Failed to update ${bodyshop.name} (${bodyshop.area}):`, err);
        }
    }

    console.log('✅ All missing coordinates updated.');
    process.exit();
}

updateMissingCoordinates();