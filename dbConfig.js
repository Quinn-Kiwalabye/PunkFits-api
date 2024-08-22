const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'Quinn', // Ensure consistent casing with your password
  host: 'localhost',
  port: 5433,
  database: 'Punkfits',
});

// Optionally, you can keep the test connection function for debugging
async function testConnection() {
  try {
    const poolRes = await pool.query('SELECT NOW()');
    console.log('Pool connection successful:', poolRes.rows[0]);
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
}

// Call this function if you want to test the connection upon startup
testConnection();

module.exports = pool;
