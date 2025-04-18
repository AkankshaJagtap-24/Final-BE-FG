const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendNotifications = async (sosData) => {
    // Send email only
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'SOS Alert!',
        text: `New SOS alert from user: ${sosData.userId}\nLocation: ${sosData.location}`
    });
};

module.exports = { sendNotifications };