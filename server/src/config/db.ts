import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // 반드시 맨 위에서 실행

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
ssl: {
    rejectUnauthorized: false // 🔐 Supabase는 반드시 SSL 필요!
  },
});

export default pool;
