const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios'); // Add this at the top

// Add these weather-related routes
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'your_api_key_here';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const WEATHER_FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// Get weather data for a location
router.get('/weather/:location', async (req, res) => {
    try {
        const location = req.params.location;
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                q: location,
                appid: WEATHER_API_KEY,
                units: 'metric'
            }
        });

        const weatherData = {
            location: response.data.name,
            temperature: response.data.main.temp,
            humidity: response.data.main.humidity,
            windSpeed: response.data.wind.speed,
            description: response.data.weather[0].description,
            timestamp: new Date()
        };

        res.status(200).json({
            success: true,
            weather: weatherData
        });
    } catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch weather data'
        });
    }
});

// Create weather alert based on conditions
router.post('/weather-alerts', authenticateToken, async (req, res) => {
    try {
        const { location, threshold } = req.body;
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                q: location,
                appid: WEATHER_API_KEY,
                units: 'metric'
            }
        });
        // console.log(response.data);
        // console.log(location); 
        const temp = response.data.main.temp;
        let severity = 'low';
        let description = '';

        // Determine severity based on temperature
        if (temp > 35) {
            severity = 'high';
            description = `Extreme heat warning: Temperature at ${temp}°C`;
        } else if (temp < 0) {
            severity = 'high';
            description = `Freezing temperature warning: Temperature at ${temp}°C`;
        }else if (temp < 20) {
            severity = 'medium';
            description = `Temperature warning: Temperature at ${temp}°C`;
        } else if (temp > 30 || temp < 5) {
            severity = 'medium';
            description = `Temperature warning: Temperature at ${temp}°C`;
        }

        // Create alert if conditions meet severity threshold
        if (severity !== 'low') {
            const [result] = await db.execute(
                'INSERT INTO alerts (title, description, severity, location, created_by, status) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    `Weather Alert for ${location}`,
                    description,
                    severity,
                    location,
                    req.user.adminId || req.user.userId,
                    'active'
                ]
            );

            res.status(201).json({
                success: true,
                message: 'Weather alert created',
                alertId: result.insertId
            });
        } else {
            res.status(200).json({
                success: true,
                message: 'No weather alerts needed',
                weather: response.data.weather
            });
        }
    } catch (error) {
        console.error('Weather alert creation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create weather alert based on conditions
router.post('/weather-forecast', authenticateToken, async (req, res) => {
    try {
        const { location, threshold } = req.body;
        const response = await axios.get(WEATHER_FORECAST_API_URL, {
            params: {
                q: location,
                appid: WEATHER_API_KEY,
                units: 'metric'
            }
        });

        // Format the forecast data
        const forecastData = {
            city: response.data.city.name,
            country: response.data.city.country,
            forecast: response.data.list.map(item => ({
                datetime: item.dt_txt,
                temperature: item.main.temp,
                feels_like: item.main.feels_like,
                humidity: item.main.humidity,
                weather: {
                    main: item.weather[0].main,
                    description: item.weather[0].description,
                    icon: item.weather[0].icon
                },
                wind: {
                    speed: item.wind.speed,
                    direction: item.wind.deg
                }
            }))
        };

        res.status(200).json({
            success: true,
            message: 'Weather forecast retrieved successfully',
            data: forecastData
        });
    } catch (error) {
        console.error('Weather forecast error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get admin notifications
router.get('/admin/notifications', authenticateToken, async (req, res) => {
    try {
        const [notifications] = await db.execute(`
            SELECT 
                id,
                title,
                message,
                type,
                is_read,
                created_at
            FROM admin_notifications
            WHERE admin_id = ?
            ORDER BY created_at DESC
        `, [req.user.userId]);

        res.status(200).json({
            success: true,
            notifications,
            unreadCount: notifications.filter(n => !n.is_read).length
        });
    } catch (error) {
        console.error('Get admin notifications error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Mark notification as read
router.put('/admin/notifications/:notificationId/read', authenticateToken, async (req, res) => {
    try {
        await db.execute(
            'UPDATE admin_notifications SET is_read = TRUE WHERE id = ? AND admin_id = ?',
            [req.params.notificationId, req.user.userId]
        );

        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create admin notification (internal function)
async function createAdminNotification(adminId, title, message, type) {
    try {
        await db.execute(
            'INSERT INTO admin_notifications (admin_id, title, message, type) VALUES (?, ?, ?, ?)',
            [adminId, title, message, type]
        );
    } catch (error) {
        console.error('Create admin notification error:', error);
    }
}

// Modify the existing alert creation route to add admin notification
// Modify the POST route
router.post('/alerts', authenticateToken, async (req, res) => {
    try {
        const { title, description, severity, location } = req.body;
        const created_by = req.user.adminId || req.user.userId; // Handle both admin and user IDs

        // Validate all required fields
        if (!title || !description || !severity || !location || !created_by) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                required: {
                    title: !title,
                    description: !description,
                    severity: !severity,
                    location: !location,
                    created_by: !created_by
                }
            });
        }

        // Validate severity value
        const validSeverities = ['low', 'medium', 'high'];
        if (!validSeverities.includes(severity.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid severity level. Must be low, medium, or high'
            });
        }

        const [result] = await db.execute(
            'INSERT INTO alerts (title, description, severity, location, created_by, status) VALUES (?, ?, ?, ?, ?, ?)',
            [
                title.trim(),
                description.trim(),
                severity.toLowerCase(),
                location.trim(),
                created_by,
                'active' // Set default status
            ]
        );

        // Create admin notification for new alert
        await createAdminNotification(
            created_by,
            'New Alert Created',
            `New ${severity} severity alert created for ${location}`,
            'alert_created'
        );

        res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            alertId: result.insertId
        });
    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all active alerts
router.get('/alerts', async (req, res) => {
    try {
        const [alerts] = await db.execute(`
            SELECT 
                a.id,
                a.title,
                a.description,
                a.severity,
                a.location,
                a.created_at,
                
                u.name as created_by_name
            FROM alerts a
            JOIN users u ON a.created_by = u.id
            WHERE a.status = 'active' 
            ORDER BY a.created_at DESC
        `);

        // Check if alerts exist
        if (!alerts || alerts.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No active alerts found',
                data: []
            });
        }

        res.status(200).json({
            success: true,
            message: 'Alerts retrieved successfully',
            data: alerts
        });
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get alerts by location
router.get('/alerts/location/:location', async (req, res) => {
    try {
        const [alerts] = await db.execute(`
            SELECT 
                a.id,
                a.title,
                a.description,
                a.severity,
                a.location,
                a.created_at,
                a.expires_at,
                u.name as created_by_name
            FROM alerts a
            JOIN users u ON a.created_by = u.id
            WHERE a.status = 'active' 
            AND a.expires_at > NOW()
            AND a.location = ?
            ORDER BY a.created_at DESC
        `, [req.params.location]);

        res.status(200).json({
            success: true,
            alerts
        });
    } catch (error) {
        console.error('Get location alerts error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add this new route for admin dashboard
router.get('/admin/alerts', authenticateToken, async (req, res) => {
    try {
        const [alerts] = await db.execute(`
            SELECT 
                a.id,
                a.title,
                a.description,
                a.severity,
                a.location,
                a.created_at,
                a.expires_at,
                a.status,
                u.name as created_by_name,
                CASE 
                    WHEN a.expires_at > NOW() AND a.status = 'active' THEN 'Active'
                    WHEN a.expires_at <= NOW() THEN 'Expired'
                    ELSE 'Inactive'
                END as alert_status
            FROM alerts a
            JOIN users u ON a.created_by = u.id
            ORDER BY a.created_at DESC
        `);

        // Format the response for admin dashboard
        const formattedAlerts = alerts.map(alert => ({
            id: alert.id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            location: alert.location,
            createdAt: alert.created_at,
            expiresAt: alert.expires_at,
            status: alert.alert_status,
            createdBy: alert.created_by_name
        }));

        res.status(200).json({
            success: true,
            alerts: formattedAlerts,
            statistics: {
                total: alerts.length,
                active: alerts.filter(a => a.alert_status === 'Active').length,
                expired: alerts.filter(a => a.alert_status === 'Expired').length,
                inactive: alerts.filter(a => a.alert_status === 'Inactive').length
            }
        });
    } catch (error) {
        console.error('Get admin alerts error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add route to update alert status
router.put('/admin/alerts/:alertId', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const alertId = req.params.alertId;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be either active or inactive'
            });
        }

        await db.execute(
            'UPDATE alerts SET status = ? WHERE id = ?',
            [status, alertId]
        );

        res.status(200).json({
            success: true,
            message: 'Alert status updated successfully'
        });
    } catch (error) {
        console.error('Update alert status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;