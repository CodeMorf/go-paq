import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
export const isPostgres = !!DATABASE_URL && DATABASE_URL.startsWith('postgres');

let pgPool: Pool | null = null;
let sqliteDb: Database.Database | null = null;

if (isPostgres) {
  console.log('[DB] Connecting to PostgreSQL database at:', DATABASE_URL.split('@')[1] || 'remote');
  pgPool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
} else {
  const dbDir = path.resolve(__dirname);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.resolve(dbDir, 'gopaq.sqlite');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
}

export function initDatabase() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  if (sqliteDb) {
    sqliteDb.exec(schemaSql);
  }
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.get(...params) as T | undefined;
  }
  throw new Error('Sync queryOne called in async PostgreSQL mode. Use async queryOneAsync.');
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params) as T[];
  }
  throw new Error('Sync queryAll called in async PostgreSQL mode. Use async queryAllAsync.');
}

export function execute(sql: string, params: any[] = []) {
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.run(...params);
  }
}

export function transaction<T>(fn: () => T): T {
  if (sqliteDb) {
    const runTx = sqliteDb.transaction(fn);
    return runTx();
  }
  return fn();
}

export async function queryAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (pgPool) {
    // Convert ? to $1, $2, etc. for PostgreSQL
    let pIdx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows as T[];
  } else if (sqliteDb) {
    return queryAll<T>(sql, params);
  }
  return [];
}
