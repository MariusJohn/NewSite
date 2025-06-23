// utils/geocode.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;

if (!OPENCAGE_API_KEY) {
    console.warn('⚠️ OPENCAGE_API_KEY is not set in your .env file. Geocoding may not work.');
}

export const geocodeAddress = async (address) => {
    if (!address) {
        throw new Error('Address cannot be empty for geocoding.');
    }

    const encodedAddress = encodeURIComponent(address);
  
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${OPENCAGE_API_KEY}&countrycode=gb&limit=1`; 

    try {
        const response = await axios.get(url);
        const data = response.data;

      
        if (data.results && data.results.length > 0 && data.status.code === 200) {
            const location = data.results[0].geometry;
            return {
                lat: location.lat,
                lng: location.lng,
                formattedAddress: data.results[0].formatted
            };
        } else if (data.status.code === 200 && data.results.length === 0) {
            console.warn(`Geocoding found zero results for address: "${address}" (OpenCage)`);
            return null;
        } else {
            console.error(`Geocoding error for address "${address}" (OpenCage): Status ${data.status.code} - ${data.status.message || 'Unknown error'}`);
            throw new Error(`Geocoding failed: ${data.status.message || 'Unknown API error'}`);
        }
    } catch (error) {
        console.error(`Error calling OpenCage Geocoding API for address "${address}":`, error.message);
        throw new Error('Failed to geocode address due to network or API call error.');
    }
};