import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/expense_tracker';

const needsSsl =
  connectionString.includes('neon.tech') ||
  connectionString.includes('supabase.com') ||
  connectionString.includes('supabase.co') ||
  connectionString.includes('sslmode=require');

export const pool = new Pool({
  connectionString,
  max: process.env.VERCEL ? 5 : 10,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
