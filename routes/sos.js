const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Create SOS alert
router.post('/sos_hit', authenticateToken, async (req, res) => {
    try {
        const { latitude, longitude, description,location } = req.body;
        const userId = req.user.userId;

        const [result] = await db.execute(
            'INSERT INTO sos_alerts (user_id, latitude, longitude, description,location) VALUES (?, ?, ?, ?,?)',
            [userId, latitude, longitude, description,location]
        );

        res.status(201).json({
            success: true,
            message: 'SOS alert created successfully',
            alertId: result.insertId
        });
    } catch (error) {
        console.error('SOS Create Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create SOS alert'
        });
    }
});

// Get all alerts
router.get('/alerts', authenticateToken, async (req, res) => {
    try {
        const [alerts] = await db.execute(`
            SELECT sa.*, u.name, u.phone 
            FROM sos_alerts sa 
            JOIN users u ON sa.user_id = u.id 
            ORDER BY sa.created_at DESC
        `);

        res.json({
            success: true,
            alerts
        });
    } catch (error) {
        console.error('Get Alerts Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts'
        });
    }
});

module.exports = router;