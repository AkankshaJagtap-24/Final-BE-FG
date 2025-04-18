const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const app = express();
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');  // Add this line
const forumRoutes = require('./routes/forum'); // Add forum routes
const sosRoutes = require('./routes/sos');    // Add SOS routes
const alertsRouter = require('./routes/alerts');
// Routes
app.use('/api', alertsRouter);
app.use('/api', adminRoutes);
app.use('/api', authRoutes);   // Add this line
app.use('/api', forumRoutes);  // Add forum routes
app.use('/api', sosRoutes);    // Add SOS routes

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});