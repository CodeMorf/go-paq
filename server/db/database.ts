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
    sqliteDb.exec(sqliteFoundationSql);
    ensureSqliteColumn('cod_transactions', 'received_branch_at', 'TEXT');
    ensureSqliteColumn('cod_transactions', 'received_branch_by', 'TEXT');
    ensureSqliteColumn('cod_transactions', 'reconciled_at', 'TEXT');
    ensureSqliteColumn('cod_transactions', 'reconciled_by', 'TEXT');
    ensureSqliteColumn('international_packages', 'merchant_name', 'TEXT');
    ensureSqliteColumn('international_packages', 'prealert_at', 'TEXT');
    sqliteDb.exec(`
      INSERT OR IGNORE INTO schema_migrations (version, applied_at)
      VALUES ('001_initial', CURRENT_TIMESTAMP), ('002_production_foundations', CURRENT_TIMESTAMP)
    `);
  }
}

export async function initDatabaseAsync() {
  if (isPostgres && pgPool) {
    await runMigrations();
  } else if (sqliteDb) {
    initDatabase();
  }
}

export async function closeDatabase() {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
}

/**
 * Apply production schema changes through an explicit, locked migration
 * history. SQLite remains available for local tests; PostgreSQL is the only
 * supported production database and receives the PostGIS migration.
 */
export async function runMigrations() {
  if (!isPostgres || !pgPool) {
    initDatabase();
    return;
  }

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const postgresBaseSchema = schemaSql
    .replace(/^\s*PRAGMA foreign_keys = ON;\s*$/m, '')
    .replace(/TEXT NOT NULL DEFAULT \(datetime\('now'\)\)/g, 'TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP');
  const migrationsDir = path.resolve(__dirname, 'migrations');
  const foundationSql = fs.readFileSync(path.join(migrationsDir, '002_production_foundations.sql'), 'utf8');
  const postgisSql = fs.readFileSync(path.join(migrationsDir, '003_postgis.sql'), 'utf8');
  const lockKey = 7874701;

  await pgPool.query('SELECT pg_advisory_lock($1)', [lockKey]);
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const applied = new Set((await pgPool.query('SELECT version FROM schema_migrations')).rows.map((row) => row.version));
    if (!applied.has('001_initial')) {
      await pgPool.query(postgresBaseSchema);
      await pgPool.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['001_initial']);
    }
    if (!applied.has('002_production_foundations')) {
      await pgPool.query(foundationSql);
      await pgPool.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['002_production_foundations']);
    }
    if (!applied.has('003_postgis')) {
      await pgPool.query(postgisSql);
      await pgPool.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['003_postgis']);
    }
  } finally {
    await pgPool.query('SELECT pg_advisory_unlock($1)', [lockKey]);
  }
}

export async function checkDatabase(): Promise<{ ok: boolean; engine: 'postgres' | 'sqlite'; postgisVersion?: string; error?: string }> {
  try {
    if (isPostgres) {
      const row = await queryOneAsync<{ version: string }>('SELECT version()');
      let postgisVersion: string | undefined;
      const extension = await queryOneAsync<{ installed: boolean }>(
        `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS installed`
      );
      if (extension?.installed) {
        const postgis = await queryOneAsync<{ version: string }>('SELECT postgis_full_version() AS version');
        postgisVersion = postgis?.version || undefined;
      }
      return { ok: !!row, engine: 'postgres', postgisVersion };
    }
    return { ok: !!queryOne('SELECT 1 as live'), engine: 'sqlite' };
  } catch (error) {
    return { ok: false, engine: isPostgres ? 'postgres' : 'sqlite', error: error instanceof Error ? error.message : 'database_error' };
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

const sqliteFoundationSql = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(organization_id, user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at, revoked_at);
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  outcome TEXT NOT NULL,
  ip_address TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON audit_logs(organization_id, created_at);
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status_code INTEGER,
  response_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  UNIQUE(organization_id, idempotency_key)
);
CREATE TABLE IF NOT EXISTS outbox_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  processed_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_events(status, next_attempt_at, created_at);
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_reset_expiry ON password_reset_tokens(expires_at, used_at);
CREATE TABLE IF NOT EXISTS cash_closes (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  closed_by TEXT NOT NULL,
  total_cash REAL NOT NULL,
  total_pos REAL NOT NULL,
  total_transfers REAL NOT NULL,
  grand_total REAL NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cash_closes_branch_created ON cash_closes(organization_id, branch_id, created_at);
`;

function ensureSqliteColumn(tableName: string, columnName: string, definition: string) {
  if (!sqliteDb) return;
  const columns = sqliteDb.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === columnName)) {
    sqliteDb.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}
