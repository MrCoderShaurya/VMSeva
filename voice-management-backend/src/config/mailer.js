const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: true,
    auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    } : undefined,
    tls: {
        rejectUnauthorized: true
    }
});

const sendMail = async ({ to, subject, text, html }) => {
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const mailOptions = { from, to, subject, text, html };
    return transporter.sendMail(mailOptions);
};

module.exports = { sendMail };
