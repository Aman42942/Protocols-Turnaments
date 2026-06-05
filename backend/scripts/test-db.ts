import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.OLD_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('Testing connection to:', process.env.OLD_DATABASE_URL?.split('@')[1]);
    await client.connect();
    console.log('✅ Connected!');
    const res = await client.query('SELECT 1 as result');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

test();
