const { Pool } = require('pg');
require('dotenv').config();

const vmpPool = new Pool({
  connectionString: process.env.VMP_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = vmpPool;
