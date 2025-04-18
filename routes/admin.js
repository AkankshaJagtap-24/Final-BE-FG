const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Admin Login Route
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', { email, password }); // Debug log

        const [admins] = await db.execute(
            'SELECT * FROM admins WHERE email = ? AND password = ?',
            [email, password]
        );

        if (admins.length > 0) {
            const token = jwt.sign(
                { adminId: admins[0].id, email: admins[0].email },
                process.env.JWT_SECRET || 'testest',
                { expiresIn: '24h' }
            );
            res.status(200).json({ 
                success: true, 
                token,
                admin: { id: admins[0].id, email: admins[0].email, name: admins[0].name }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add SOS Alerts endpoint
router.get('/admin/sos-alerts', async (req, res) => {
    try {
        const [alerts] = await db.execute(`
            SELECT 
                s.*,
                u.name as user_name,
                u.email as user_email
            FROM sos_alerts s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        `);

        res.status(200).json({
            success: true,
            alerts: alerts
        });
    } catch (error) {
        console.error('Error fetching SOS alerts:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Add Forum Posts endpoint
router.get('/admin/forum-posts', async (req, res) => {
    try {
        const [posts] = await db.execute(`
            SELECT 
                f.*,
                u.name as author_name
            FROM forum_posts f
            LEFT JOIN users u ON f.user_id = u.id
            ORDER BY f.created_at DESC
        `);

        res.status(200).json({
            success: true,
            posts: posts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add Users endpoint
router.get('/admin/users', async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, name, email, phone, status, created_at FROM users'
        );

        res.status(200).json({
            success: true,
            users: users
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add Alerts endpoint
router.get('/admin/dashboard-alerts', async (req, res) => {
    try {
        const [alerts] = await db.execute(`
            SELECT 
                a.*,
                u.name as created_by_name,
                u.email as created_by_email
            FROM alerts a
            LEFT JOIN users u ON a.created_by = u.id
            ORDER BY a.created_at DESC
        `);

        // Get statistics
        const totalAlerts = alerts.length;
        const activeAlerts = alerts.filter(a => a.status === 'active').length;
        const inactiveAlerts = alerts.filter(a => a.status === 'inactive').length;

        res.status(200).json({
            success: true,
            alerts: alerts,
            statistics: {
                total: totalAlerts,
                active: activeAlerts,
                inactive: inactiveAlerts
            }
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
module.exports = router;