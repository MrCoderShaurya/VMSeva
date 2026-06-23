const nodemailer = require('nodemailer');

const sendMail = ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
  return transporter.sendMail({ from: `"VMSeva" <${process.env.MAIL_USER}>`, to, subject, html });
};

module.exports = sendMail;
