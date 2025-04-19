const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

// Get weather data
router.post('/', async (req, res) => {
    try {
        const { city } = req.body;

        if (!city) {
            return res.status(400).json({
                success: false,
                message: 'City name is required'
            });
        }

        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
                q: city,
                appid: process.env.WEATHER_API_KEY,
                units: 'metric'
            }
        });

        res.json({
            success: true,
            weather: {
                temperature: response.data.main.temp,
                humidity: response.data.main.humidity,
                description: response.data.weather[0].description,
                windSpeed: response.data.wind.speed
            }
        });
    } catch (error) {
        console.error('Weather API Error:', error.response?.data || error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weather data'
        });
    }
});

module.exports = router;