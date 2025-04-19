# Final-BE-FG Backend
# Emergency Alert System

A Node.js backend system for managing emergency alerts, weather monitoring, and SOS notifications.

## Features
- User Authentication
- Emergency SOS System
- Weather Monitoring
- Admin Dashboard
- Email Notifications

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with required variables
4. Setup MySQL database
5. Run: `npm start`

## Environment Variables
```env
PORT=5001
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
WEATHER_API_KEY=your_weather_api_key
