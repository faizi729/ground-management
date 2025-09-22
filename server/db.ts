import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import dns from 'dns';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}
dns.setDefaultResultOrder('ipv4first');
const pool = new Pool({ connectionString: process.env.DATABASE_URL,

  ssl: { rejectUnauthorized: false }
 });
export const db = drizzle(pool);
