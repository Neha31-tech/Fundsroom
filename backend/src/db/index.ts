import { Pool } from 'pg';
import { env } from 'cloudflare:workers';
import dotenv from 'dotenv';

dotenv.config();

export let pool: Pool;

export const initDb = (connectionString?: string) => {
  if (pool) return pool;

  // Cloudflare Hyperdrive
  const hyperdriveConnection =
    connectionString || env.HYPERDRIVE?.connectionString;

  if (hyperdriveConnection) {
    pool = new Pool({
      connectionString: hyperdriveConnection,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  } else {
    // Local development
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return pool;
};

export const query = (text: string, params?: any[]) => {
  if (!pool) {
    initDb();
  }

  return pool.query(text, params);
};