require('dotenv').config();
const express = require('express');
const cors = require('cors');
const createTables = require('./src/db/migrate');
const { createVmpTables } = require('./src/db/migrateVmp');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://10.73.45.26:8081',
    'https://vmseva.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/preaching', require('./src/routes/preaching'));

app.get('/', (req, res) => res.json({ status: 'ok', message: 'VMSeva API is running' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/test-mail', async (req, res) => {
  try {
    const sendMail = require('./src/config/mailer');
    await sendMail({ to: process.env.MAIL_USER, subject: 'Test', html: '<p>Mail works</p>' });
    res.json({ ok: true, user: process.env.MAIL_USER, pass: process.env.MAIL_PASS ? 'set(' + process.env.MAIL_PASS.length + ')' : 'MISSING' });
  } catch (err) {
    res.json({ ok: false, error: err.message, user: process.env.MAIL_USER, pass: process.env.MAIL_PASS ? 'set(' + process.env.MAIL_PASS.length + ')' : 'MISSING' });
  }
});

const PORT = process.env.PORT || 5000;

Promise.all([createTables(), createVmpTables()])
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });
