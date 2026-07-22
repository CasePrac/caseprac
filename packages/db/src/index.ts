import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const currentDir = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(currentDir, '../../../.env') });

export * from 'drizzle-orm';
export * from './schema';
export * from './importer';
export { schema };

export function createDb(connectionString?: string) {
  const url = connectionString || process.env.DATABASE_URL || 'postgres://caseprac:caseprac_password@localhost:5432/caseprac_db';
  const queryClient = postgres(url);
  return drizzle(queryClient, { schema });
}

export type Database = ReturnType<typeof createDb>;
