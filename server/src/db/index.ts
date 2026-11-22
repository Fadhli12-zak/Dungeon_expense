import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const rawConnectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/expense_tracker';

const needsSsl =
  rawConnectionString.includes('neon.tech') ||
  rawConnectionString.includes('supabase.com') ||
  rawConnectionString.includes('supabase.co') ||
  rawConnectionString.includes('sslmode=require') ||
  Boolean(process.env.VERCEL);

// Strip sslmode from URL so pg-connection-string does not override rejectUnauthorized: false
let connectionString = rawConnectionString;
if (needsSsl) {
  try {
    const parsedUrl = new URL(rawConnectionString);
    parsedUrl.searchParams.delete('sslmode');
    connectionString = parsedUrl.toString();
  } catch {
    // Keep original string if URL parsing fails
  }
}

export const pool = new Pool({
  connectionString,
  max: process.env.VERCEL ? 5 : 10,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
