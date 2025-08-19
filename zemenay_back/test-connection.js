const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

async function testConnection() {
  console.log('Attempting to connect to the database...');
  console.log('Connection URL:', process.env.DATABASE_URL?.split('@')[1] || 'Not found');
  
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('Database version:', result.rows[0].version);
    
    // List tables
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('\nAvailable tables:');
    console.table(tables.rows);
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to the database:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
