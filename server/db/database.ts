import Database from 'better-sqlite3';
import { Pool, PoolClient } from 'pg';
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

export async function initDatabaseAsync() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  if (isPostgres && pgPool) {
    // Execute PostgreSQL DDL
    await pgPool.query(schemaSql);
  } else if (sqliteDb) {
    sqliteDb.exec(schemaSql);
  }
}

export async function queryOneAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  if (isPostgres && pgPool) {
    let pIdx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
    const res = await pgPool.query(pgSql, params);
    return (res.rows[0] as T) || null;
  }
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const row = stmt.get(...params) as T | undefined;
    return row || null;
  }
  return null;
}

export async function queryAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (isPostgres && pgPool) {
    let pIdx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows as T[];
  }
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params) as T[];
  }
  return [];
}

export async function executeAsync(sql: string, params: any[] = []): Promise<{ changes: number }> {
  if (isPostgres && pgPool) {
    let pIdx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
    const res = await pgPool.query(pgSql, params);
    return { changes: res.rowCount || 0 };
  }
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const info = stmt.run(...params);
    return { changes: info.changes };
  }
  return { changes: 0 };
}

export async function transactionAsync<T>(callback: (client: { queryOne: typeof queryOneAsync; queryAll: typeof queryAllAsync; execute: typeof executeAsync }) => Promise<T>): Promise<T> {
  if (isPostgres && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const scopedClient = {
        queryOne: async <R = any>(sql: string, params: any[] = []) => {
          let pIdx = 1;
          const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
          const res = await client.query(pgSql, params);
          return (res.rows[0] as R) || null;
        },
        queryAll: async <R = any>(sql: string, params: any[] = []) => {
          let pIdx = 1;
          const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
          const res = await client.query(pgSql, params);
          return res.rows as R[];
        },
        execute: async (sql: string, params: any[] = []) => {
          let pIdx = 1;
          const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
          const res = await client.query(pgSql, params);
          return { changes: res.rowCount || 0 };
        }
      };
      const result = await callback(scopedClient);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // SQLite transaction with rollback support
  if (sqliteDb) {
    sqliteDb.exec('BEGIN');
    try {
      const scopedClient = {
        queryOne: queryOneAsync,
        queryAll: queryAllAsync,
        execute: executeAsync
      };
      const result = await callback(scopedClient);
      sqliteDb.exec('COMMIT');
      return result;
    } catch (err) {
      sqliteDb.exec('ROLLBACK');
      throw err;
    }
  }

  return await callback({
    queryOne: queryOneAsync,
    queryAll: queryAllAsync,
    execute: executeAsync
  });
}

// Synchronous Fallbacks for existing synchronous tests
export function queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.get(...params) as T | undefined;
  }
  return undefined;
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params) as T[];
  }
  return [];
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
