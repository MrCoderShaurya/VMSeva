const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

pool.query('SELECT NOW()', (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Database connected successfully');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
