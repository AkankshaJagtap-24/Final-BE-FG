const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Create SOS alert
router.post('/sos_hit', authenticateToken, async (req, res) => {
    try {
        const { latitude, longitude, description, location } = req.body;
        const userId = req.user.userId;

        // Get user details from database with email
        const [userDetails] = await db.execute(
            'SELECT name, email, phone FROM users WHERE id = ?',
            [userId]
        );
        const user = userDetails[0];

        if (!user || !user.email) {
            throw new Error('User email not found');
        }

        // Insert SOS alert
        const [result] = await db.execute(
            'INSERT INTO sos_alerts (user_id, latitude, longitude, description, location) VALUES (?, ?, ?, ?, ?)',
            [userId, latitude, longitude, description, location]
        );

        // Create Google Maps link and email content
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const emailContent = `
            <h2>⚠️ Emergency SOS Alert</h2>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Coordinates:</strong> ${latitude}, ${longitude}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>User:</strong> ${user.name}</p>
            <p><strong>Contact:</strong> ${user.phone}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Track My Location:</strong> <a href="${mapLink}" target="_blank">Click here to view my location on Google Maps</a></p>
            <p style="color: red;"><strong>This is an emergency SOS alert. Please respond immediately!</strong></p>
        `;

        // Setup email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'jagtapakanksha424@gmail.com',
                pass: process.env.EMAIL_PASS
            }
        });

        // First send alert to admin
        await transporter.sendMail({
            from: `"${user.name} - Emergency SOS" <jagtapakanksha424@gmail.com>`,
            to: 'jagtapakanksha424@gmail.com',
            subject: `⚠️ EMERGENCY SOS from ${user.name} - Location: ${location}`,
            html: emailContent,
            replyTo: user.email,
            priority: 'high'
        }).catch(error => {
            console.error('Admin email error:', error);
            throw new Error('Failed to send admin notification');
        });

        // Define user confirmation content
        const userConfirmationContent = `
            <h2>🚨 Your SOS Alert Has Been Received</h2>
            <p>Dear ${user.name},</p>
            <p>We have received your emergency SOS alert and our team has been notified immediately. Help is on the way.</p>
            
            <h3>Important Steps to Follow:</h3>
            <ul>
                <li>Stay calm and find a safe location if possible</li>
                <li>Keep your phone charged and with you</li>
                <li>Stay at your current location unless you're in immediate danger</li>
                <li>Keep your GPS location enabled</li>
            </ul>

            <p><strong>Your Alert Details:</strong></p>
            <ul>
                <li>Location: ${location}</li>
                <li>Time Reported: ${new Date().toLocaleString()}</li>
                <li>Your Contact: ${user.phone}</li>
            </ul>

            <p>Our emergency response team has been notified and will contact you shortly.</p>
            
            <p style="color: #0066cc;"><strong>Stay calm. Help is on the way.</strong></p>

            <p>For any updates or changes to your situation, please:</p>
            <ul>
                <li>Reply directly to this email</li>
                <li>Or send another SOS alert through the app</li>
            </ul>

            <p>Best regards,<br>
            FloodGuard Emergency Response Team</p>
        `;

        // Then send confirmation to user
        await transporter.sendMail({
            from: 'jagtapakanksha424@gmail.com',
            to: user.email,
            subject: '✅ SOS Alert Received - Help is Coming',
            html: userConfirmationContent,
            priority: 'high'
        }).catch(error => {
            console.error('User confirmation email error:', error);
            throw new Error('Failed to send user confirmation');
        });

        res.status(201).json({
            success: true,
            message: 'SOS alert created and notifications sent',
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

router.post('/sos', authenticateToken, async (req, res) => {
    try {
        const { latitude, longitude, description, location } = req.body;
        const userId = req.user.userId;

        const [result] = await db.execute(
            'INSERT INTO sos_alerts (user_id, latitude, longitude, description,location) VALUES (?, ?, ?, ?,?)',
            [userId, latitude, longitude, description, location]
        );

        // Add email notification
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const emailContent = `
            <h2>⚠️ Emergency SOS Alert</h2>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Coordinates:</strong> ${latitude}, ${longitude}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>User:</strong> ${req.user.name}</p>
            <p><strong>Contact:</strong> ${req.user.phone}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><a href="${mapLink}" target="_blank">View Location on Map</a></p>
        `;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: '⚠️ Emergency SOS Alert',
            html: emailContent
        });

        res.json({ success: true, message: 'SOS alert created and notification sent' });
    } catch (error) {
        console.error('SOS creation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;