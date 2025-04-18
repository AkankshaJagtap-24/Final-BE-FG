const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Add this after the transporter configuration
const ADMIN_EMAILS = [
    'co.a.43.akanksha.jagtap@gmail.com',
    'co.a.44.akanksha.jagtap@gmail.com'
];

// Function to send admin notification email
async function sendSOSNotificationEmail(sosData, userData) {
    try {
        const emailContent = `
            <h2>⚠️ Emergency SOS Alert</h2>
            <p><strong>Location:</strong> ${sosData.location}</p>
            <p><strong>City:</strong> ${sosData.city}</p>
            <p><strong>Coordinates:</strong> ${sosData.lat}, ${sosData.log}</p>
            <p><strong>Description:</strong> ${sosData.description}</p>
            <p><strong>User:</strong> ${userData.name}</p>
            <p><strong>Contact:</strong> ${userData.phone || 'Not provided'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        `;

        // Send to all admin emails in the array
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: ADMIN_EMAILS.join(', '),
            subject: '🚨 Emergency SOS Alert',
            html: emailContent
        });
    } catch (error) {
        console.error('Email sending failed:', error);
    }
}

router.post('/sos_hit', authenticateToken, async (req, res) => {
    try {
        const { location, lat, log, city, description } = req.body;
        const userId = req.user.userId;
        
        // Get user details for email
        const [userDetails] = await db.execute(
            'SELECT name, email, phone FROM users WHERE id = ?',
            [userId]
        );

        // Save to database with new parameters
        const [result] = await db.execute(
            `INSERT INTO sos_alerts 
            (user_id, location, latitude, longitude, city, description, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [userId, location, lat, log, city, description]
        );

        // Send email to admin
        await sendSOSNotificationEmail(
            { location, lat, log, city, description },
            userDetails[0]
        );

        res.status(200).json({ 
            success: true, 
            message: 'SOS alert sent successfully',
            alertId: result.insertId
        });
    } catch (error) {
        console.error('SOS alert error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;