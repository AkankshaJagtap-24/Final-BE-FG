const express = require('express');
const router = express.Router();
const axios = require('axios');

// Current weather
router.post('/', async (req, res) => {
    try {
        const { city } = req.body;
        if (!city) {
            return res.status(400).json({
                success: false,
                message: 'City name is required'
            });
        }

        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q: city,
                appid: process.env.WEATHER_API_KEY,
                units: 'metric'
            }
        });

        const weatherData = {
            city: response.data.name,
            temperature: response.data.main.temp,
            humidity: response.data.main.humidity,
            description: response.data.weather[0].description,
            windSpeed: response.data.wind.speed
        };

        res.json({
            success: true,
            weather: weatherData
        });
    } catch (error) {
        console.error('Weather API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weather data'
        });
    }
});

// Weather forecast
router.post('/forecast', async (req, res) => {
    try {
        const { city } = req.body;
        if (!city) {
            return res.status(400).json({
                success: false,
                message: 'City name is required'
            });
        }

        const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
            params: {
                q: city,
                appid: process.env.WEATHER_API_KEY,
                units: 'metric'
            }
        });

        const forecast = response.data.list.map(item => ({
            date: item.dt_txt,
            temperature: item.main.temp,
            humidity: item.main.humidity,
            description: item.weather[0].description,
            windSpeed: item.wind.speed
        }));

        res.json({
            success: true,
            city: response.data.city.name,
            forecast: forecast
        });
    } catch (error) {
        console.error('Forecast API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch forecast data'
        });
    }
});

// Weather alerts
router.post('/alerts', async (req, res) => {
    try {
        const { city } = req.body;
        if (!city) {
            return res.status(400).json({
                success: false,
                message: 'City name is required'
            });
        }

        // Get weather data with alerts
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q: city,
                appid: process.env.WEATHER_API_KEY,
                units: 'metric'
            }
        });

        // Process weather data
        const weatherData = {
            city: response.data.name,
            coordinates: {
                lat: response.data.coord.lat,
                lon: response.data.coord.lon
            },
            current: {
                temperature: response.data.main.temp,
                humidity: response.data.main.humidity,
                windSpeed: response.data.wind.speed,
                description: response.data.weather[0].description,
                main: response.data.weather[0].main
            },
            alerts: []
        };

        // Add alerts based on conditions
        if (response.data.main.temp > 35) {
            weatherData.alerts.push({
                type: 'High Temperature',
                severity: 'Warning',
                description: 'Extreme heat conditions expected'
            });
        }
        if (response.data.main.humidity > 85) {
            weatherData.alerts.push({
                type: 'High Humidity',
                severity: 'Advisory',
                description: 'High humidity levels may cause discomfort'
            });
        }
        if (response.data.wind.speed > 10) {
            weatherData.alerts.push({
                type: 'Strong Winds',
                severity: 'Advisory',
                description: 'Strong winds may affect outdoor activities'
            });
        }

        res.json({
            success: true,
            data: weatherData
        });

    } catch (error) {
        console.error('Weather Alerts Error:', error.response?.data || error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weather alerts'
        });
    }
});

module.exports = router;