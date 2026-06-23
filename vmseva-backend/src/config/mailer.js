const nodemailer = require('nodemailer');

const sendMail = ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  return transporter.sendMail({ from: `"VMSeva" <${process.env.MAIL_USER}>`, to, subject, html });
};

module.exports = sendMail;
