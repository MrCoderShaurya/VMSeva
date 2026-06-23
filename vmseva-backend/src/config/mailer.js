const https = require('https');

const sendMail = ({ to, subject, html }) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      sender: { name: 'VMSeva', email: process.env.MAIL_USER },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error(`Brevo error ${res.statusCode}: ${data}`));
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

module.exports = sendMail;
