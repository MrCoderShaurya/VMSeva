const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((err) => {
    if (err) console.error('Mailer config error:', err.message);
    else console.log('Mailer ready');
});

const sendMail = async ({ to, subject, text, html }) => {
    return transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to, subject, text, html
    });
};

module.exports = { sendMail };
