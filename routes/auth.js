const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');  // Fix: Correct import syntax

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Query database
        const [rows] = await db.execute(
            'SELECT id, name, email,pincode,city,state FROM users WHERE email = ? AND password = ?',
            [email, password]
        );

        if (rows.length > 0) {
            const user = rows[0];
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email 
                },
                process.env.JWT_SECRET || 'testest',  // Fallback secret key
                { 
                    expiresIn: '24h'
                }
            );

            res.status(200).json({ 
                success: true, 
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    city: user.city,
                    state: user.state,
                    pincode: user.pincode
                }
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, city, state, pincode, mobile } = req.body;

        // Validate input
        if (!name || !email || !password || !city || !state || !pincode || !mobile) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, city, state, pincode and mobile are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate mobile format (10 digits)
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number format. Must be 10 digits'
            });
        }

        // Check if email already exists
        const [existingUser] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Insert new user with mobile
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, city, state, pincode, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, password, city, state, pincode, mobile]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: result.insertId,
                name,
                email,
                city,
                state,
                pincode,
                mobile
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// // Add this new route after existing routes
// router.get('/user/:userId', authenticateToken, async (req, res) => {
//     try {
//         // Ensure userId matches authenticated user
//         if (req.params.userId != req.user.userId) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Access denied'
//             });
//         }

//         const [rows] = await db.execute(
//             'SELECT id, name, email, city, pincode, state FROM users WHERE id = ?',
//             [req.params.userId]
//         );

//         if (rows.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }

//         res.status(200).json({
//             success: true,
//             user: rows[0]
//         });
//     } catch (error) {
//         console.error('Get user error:', error);
//         res.status(500).json({
//             success: false,
//             error: 'Internal server error'
//         });
//     }
// });

// router.put('/user/update', authenticateToken, async (req, res) => {
//     try {
//         const { name, city, pincode, state } = req.body;
//         const userId = req.user.userId;

//         // Validate input
//         if (!name || !city || !pincode || !state) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Name, city, pincode and state are required'
//             });
//         }

//         // Update user
//         const [result] = await db.execute(
//             'UPDATE users SET name = ?, city = ?, pincode = ?, state = ? WHERE id = ?',
//             [name, city, pincode, state, userId]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }

//         // Get updated user details
//         const [rows] = await db.execute(
//             'SELECT id, name, email, city, pincode, state FROM users WHERE id = ?',
//             [userId]
//         );

//         res.status(200).json({
//             success: true,
//             message: 'User updated successfully',
//             user: rows[0]
//         });
//     } catch (error) {
//         console.error('Update user error:', error);
//         res.status(500).json({
//             success: false,
//             error: 'Internal server error'
//         });
//     }
// });
// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name, email, city, pincode, state, phone FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        res.status(200).json({
            success: true,
            profile: rows[0]
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, city, state, pincode, phone } = req.body;

        // Validate input
        if (!name || !city || !state || !pincode || !phone) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate phone format
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format. Must be 10 digits'
            });
        }

        // Update user profile
        const [result] = await db.execute(
            'UPDATE users SET name = ?, city = ?, state = ?, pincode = ?, phone = ? WHERE id = ?',
            [name, city, state, pincode, phone, req.user.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Get updated profile
        const [rows] = await db.execute(
            'SELECT id, name, email, city, pincode, state, phone FROM users WHERE id = ?',
            [req.user.userId]
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            profile: rows[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
module.exports = router;
