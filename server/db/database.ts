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
  const configuredSqlitePath = process.env.SQLITE_PATH ? path.resolve(process.env.SQLITE_PATH) : null;
  const dbDir = configuredSqlitePath ? path.dirname(configuredSqlitePath) : path.resolve(__dirname);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = configuredSqlitePath || path.resolve(dbDir, 'gopaq.sqlite');
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
    ensureSqliteColumn('moving_orders', 'job_id', 'TEXT');
    ensureSqliteColumn('heavy_cargo_orders', 'job_id', 'TEXT');
    ensureSqliteColumn('route_stops', 'job_id', 'TEXT');
    ensureSqliteColumn('branches', 'logo_storage_key', 'TEXT');
    ensureSqliteColumn('branches', 'country', "TEXT NOT NULL DEFAULT 'DO'");
    ensureSqliteColumn('branches', 'province', 'TEXT');
    ensureSqliteColumn('branches', 'sector', 'TEXT');
    ensureSqliteColumn('branches', 'postal_code', 'TEXT');
    ensureSqliteColumn('branches', 'whatsapp', 'TEXT');
    ensureSqliteColumn('branches', 'email', 'TEXT');
    ensureSqliteColumn('branches', 'business_hours_json', "TEXT NOT NULL DEFAULT '{}'");
    ensureSqliteColumn('branches', 'branch_type', "TEXT NOT NULL DEFAULT 'branch'");
    ensureSqliteColumn('branches', 'manager_phone', 'TEXT');
    ensureSqliteColumn('branches', 'manager_email', 'TEXT');
    ensureSqliteColumn('dangerous_zones', 'latitude', 'REAL');
    ensureSqliteColumn('dangerous_zones', 'longitude', 'REAL');
    ensureSqliteColumn('dangerous_zones', 'radius_m', 'INTEGER NOT NULL DEFAULT 500');
    ensureSqliteColumn('dangerous_zones', 'description', "TEXT NOT NULL DEFAULT ''");
    ensureSqliteColumn('dangerous_zones', 'country', "TEXT NOT NULL DEFAULT 'DO'");
    ensureSqliteColumn('dangerous_zones', 'province', 'TEXT');
    ensureSqliteColumn('dangerous_zones', 'sector', 'TEXT');
    ensureSqliteColumn('dangerous_zones', 'alert_reason', "TEXT NOT NULL DEFAULT ''");
    ensureSqliteColumn('dangerous_zones', 'updated_by', 'TEXT');
    ensureSqliteColumn('dangerous_zones', 'updated_at', 'TEXT');
    ensureSqliteColumn('rates_matrix', 'pricing_mode', "TEXT NOT NULL DEFAULT 'base_plus_weight'");
    ensureSqliteColumn('rates_matrix', 'weight_unit', "TEXT NOT NULL DEFAULT 'kg'");
    ensureSqliteColumn('rates_matrix', 'included_weight', 'REAL NOT NULL DEFAULT 1');
    ensureSqliteColumn('rates_matrix', 'additional_weight_step', 'REAL NOT NULL DEFAULT 1');
    ensureSqliteColumn('rates_matrix', 'additional_weight_rate', 'REAL');
    ensureSqliteColumn('rates_matrix', 'included_distance_km', 'REAL NOT NULL DEFAULT 0');
    ensureSqliteColumn('rates_matrix', 'distance_rate', 'REAL NOT NULL DEFAULT 0');
    ensureSqliteColumn('rates_matrix', 'updated_at', 'TEXT');
    ensureSqliteColumn('rates_matrix', 'rule_code', 'TEXT');
    ensureSqliteColumn('rates_matrix', 'priority', 'INTEGER NOT NULL DEFAULT 100');
    ensureSqliteColumn('rates_matrix', 'client_id', 'TEXT');
    ensureSqliteColumn('rates_matrix', 'branch_id', 'TEXT');
    ensureSqliteColumn('rates_matrix', 'service_variant', 'TEXT');
    ensureSqliteColumn('rates_matrix', 'tiers_json', "TEXT NOT NULL DEFAULT '[]'");
    ensureSqliteColumn('rates_matrix', 'surcharges_json', "TEXT NOT NULL DEFAULT '{}'");
    ensureSqliteColumn('rates_matrix', 'max_weight', 'REAL');
    ensureSqliteColumn('clients', 'country', 'TEXT');
    ensureSqliteColumn('clients', 'province', 'TEXT');
    ensureSqliteColumn('clients', 'city', 'TEXT');
    ensureSqliteColumn('drivers', 'photo_storage_key', 'TEXT');
    ensureSqliteColumn('drivers', 'photo_uploaded_at', 'TEXT');
    ensureSqliteColumn('drivers', 'card_number', 'TEXT');
    ensureSqliteColumn('drivers', 'card_issued_at', 'TEXT');
    sqliteDb.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_org_card_number ON drivers(organization_id, card_number) WHERE card_number IS NOT NULL`);
    ensureSqliteColumn('cash_closes', 'close_date', 'TEXT');
    sqliteDb.exec(`UPDATE cash_closes SET close_date = substr(created_at, 1, 10) WHERE close_date IS NULL OR close_date = ''`);
    sqliteDb.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_closes_one_per_day ON cash_closes(organization_id, branch_id, close_date)');
    sqliteDb.exec(`CREATE TABLE IF NOT EXISTS route_dispatches (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, route_id TEXT NOT NULL, request_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'dispatching', provider TEXT NOT NULL DEFAULT 'witylogix', remote_route_id TEXT, remote_order_ids_json TEXT NOT NULL DEFAULT '[]', integration_json TEXT NOT NULL DEFAULT '{}', error TEXT, response_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE (organization_id, route_id))`);
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_route_dispatches_org_status ON route_dispatches(organization_id, status, updated_at)');
    sqliteDb.exec(`UPDATE rates_matrix SET pricing_mode = 'hybrid', included_distance_km = 0, distance_rate = 85, surcharges_json = '{"floor_no_elevator":{"type":"unit","value":600},"crew_member":{"type":"unit","value":1200}}' WHERE id = 'rate-moving' AND service_type = 'mudanza' AND base_rate = 4500 AND per_vol_rate = 850 AND COALESCE(distance_rate, 0) = 0 AND COALESCE(surcharges_json, '{}') = '{}'`);
    sqliteDb.exec(`UPDATE rates_matrix SET pricing_mode = 'base_plus_weight', surcharges_json = '{"pallet":{"type":"unit","value":750},"equipment":{"type":"fixed","value":2500}}' WHERE id = 'rate-heavy' AND service_type = 'carga_pesada' AND base_rate = 8500 AND per_kg_rate = 18 AND per_vol_rate = 500 AND COALESCE(surcharges_json, '{}') = '{}'`);
    sqliteDb.exec(`
      INSERT OR IGNORE INTO schema_migrations (version, applied_at)
      VALUES
        ('001_initial', CURRENT_TIMESTAMP),
        ('002_production_foundations', CURRENT_TIMESTAMP),
        ('003_postgis', CURRENT_TIMESTAMP),
        ('004_cod_state_machine', CURRENT_TIMESTAMP),
        ('005_logistics_jobs', CURRENT_TIMESTAMP),
        ('006_configuration_center', CURRENT_TIMESTAMP),
        ('007_google_maps_credentials', CURRENT_TIMESTAMP),
        ('008_admin_master_data', CURRENT_TIMESTAMP),
        ('009_geographic_catalog_and_weight_cap', CURRENT_TIMESTAMP),
        ('010_driver_photo_upload_and_cards', CURRENT_TIMESTAMP),
        ('011_cash_close_idempotency', CURRENT_TIMESTAMP),
        ('012_special_service_pricing', CURRENT_TIMESTAMP),
        ('013_route_dispatches', CURRENT_TIMESTAMP)
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
  const codAndInternationalSql = fs.readFileSync(path.join(migrationsDir, '004_cod_state_machine.sql'), 'utf8');
  const logisticsJobsSql = fs.readFileSync(path.join(migrationsDir, '005_logistics_jobs.sql'), 'utf8');
  const configurationCenterSql = fs.readFileSync(path.join(migrationsDir, '006_configuration_center.sql'), 'utf8');
  const googleMapsCredentialsSql = fs.readFileSync(path.join(migrationsDir, '007_google_maps_credentials.sql'), 'utf8');
  const adminMasterDataSql = fs.readFileSync(path.join(migrationsDir, '008_admin_master_data.sql'), 'utf8');
  const geographicCatalogSql = fs.readFileSync(path.join(migrationsDir, '009_geographic_catalog_and_weight_cap.sql'), 'utf8');
  const driverPhotoCardsSql = fs.readFileSync(path.join(migrationsDir, '010_driver_photo_upload_and_cards.sql'), 'utf8');
  const cashCloseSql = fs.readFileSync(path.join(migrationsDir, '011_cash_close_idempotency.sql'), 'utf8');
  const specialServicePricingSql = fs.readFileSync(path.join(migrationsDir, '012_special_service_pricing.sql'), 'utf8');
  const routeDispatchesSql = fs.readFileSync(path.join(migrationsDir, '013_route_dispatches.sql'), 'utf8');
  const geographyActiveNormalizationSql = fs.readFileSync(path.join(migrationsDir, '014_normalize_geography_active.sql'), 'utf8');
  const operationalQueryIndexesSql = fs.readFileSync(path.join(migrationsDir, '015_operational_query_indexes.sql'), 'utf8');
  const codShipmentIndexSql = fs.readFileSync(path.join(migrationsDir, '016_cod_shipment_index.sql'), 'utf8');
  const lockKey = 7874701;

  const migrationClient = await pgPool.connect();
  try {
    await migrationClient.query('SELECT pg_advisory_lock($1)', [lockKey]);
    await migrationClient.query('BEGIN');
    await migrationClient.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const applied = new Set((await migrationClient.query('SELECT version FROM schema_migrations')).rows.map((row) => row.version));
    if (!applied.has('001_initial')) {
      await migrationClient.query(postgresBaseSchema);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['001_initial']);
    }
    if (!applied.has('002_production_foundations')) {
      await migrationClient.query(foundationSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['002_production_foundations']);
    }
    if (!applied.has('003_postgis')) {
      await migrationClient.query(postgisSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['003_postgis']);
    }
    if (!applied.has('004_cod_state_machine')) {
      await migrationClient.query(codAndInternationalSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['004_cod_state_machine']);
    }
    if (!applied.has('005_logistics_jobs')) {
      await migrationClient.query(logisticsJobsSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['005_logistics_jobs']);
    }
    if (!applied.has('006_configuration_center')) {
      await migrationClient.query(configurationCenterSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['006_configuration_center']);
    }
    if (!applied.has('007_google_maps_credentials')) {
      await migrationClient.query(googleMapsCredentialsSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['007_google_maps_credentials']);
    }
    if (!applied.has('008_admin_master_data')) {
      await migrationClient.query(adminMasterDataSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['008_admin_master_data']);
    }
    if (!applied.has('009_geographic_catalog_and_weight_cap')) {
      await migrationClient.query(geographicCatalogSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['009_geographic_catalog_and_weight_cap']);
    }
    if (!applied.has('010_driver_photo_upload_and_cards')) {
      await migrationClient.query(driverPhotoCardsSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['010_driver_photo_upload_and_cards']);
    }
    if (!applied.has('011_cash_close_idempotency')) {
      await migrationClient.query(cashCloseSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['011_cash_close_idempotency']);
    }
    if (!applied.has('012_special_service_pricing')) {
      await migrationClient.query(specialServicePricingSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['012_special_service_pricing']);
    }
    if (!applied.has('013_route_dispatches')) {
      await migrationClient.query(routeDispatchesSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['013_route_dispatches']);
    }
    if (!applied.has('014_normalize_geography_active')) {
      await migrationClient.query(geographyActiveNormalizationSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['014_normalize_geography_active']);
    }
    if (!applied.has('015_operational_query_indexes')) {
      await migrationClient.query(operationalQueryIndexesSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['015_operational_query_indexes']);
    }
    if (!applied.has('016_cod_shipment_index')) {
      await migrationClient.query(codShipmentIndexSql);
      await migrationClient.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['016_cod_shipment_index']);
    }
    await migrationClient.query('COMMIT');
  } catch (error) {
    await migrationClient.query('ROLLBACK');
    throw error;
  } finally {
    await migrationClient.query('SELECT pg_advisory_unlock($1)', [lockKey]);
    migrationClient.release();
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
  close_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cash_closes_branch_created ON cash_closes(organization_id, branch_id, created_at);
CREATE TABLE IF NOT EXISTS logistics_jobs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  client_id TEXT,
  service_type TEXT NOT NULL,
  tracking_number TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked',
  origin_json TEXT NOT NULL,
  destination_json TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  cost REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DOP',
  assigned_driver_id TEXT,
  assigned_route_id TEXT,
  scheduled_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS logistics_job_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT NOT NULL,
  actor_type TEXT,
  actor_id TEXT,
  extra_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON logistics_jobs(organization_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_org_driver_status ON logistics_jobs(organization_id, assigned_driver_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_org_route ON logistics_jobs(organization_id, assigned_route_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org_client ON logistics_jobs(organization_id, client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_events_org_job_created ON logistics_job_events(organization_id, job_id, created_at);
CREATE TABLE IF NOT EXISTS organization_settings (
  organization_id TEXT PRIMARY KEY,
  settings_json TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS organization_setting_revisions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  settings_json TEXT NOT NULL,
  changed_by TEXT,
  change_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, version)
);
CREATE INDEX IF NOT EXISTS idx_org_settings_updated ON organization_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_org_setting_revisions_org_created ON organization_setting_revisions(organization_id, created_at);
CREATE TABLE IF NOT EXISTS organization_integration_credentials (
  organization_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  key_hint TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_org_integration_credentials_provider ON organization_integration_credentials(provider, updated_at);
`;

function ensureSqliteColumn(tableName: string, columnName: string, definition: string) {
  if (!sqliteDb) return;
  const columns = sqliteDb.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === columnName)) {
    sqliteDb.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}
