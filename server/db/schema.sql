-- ==========================================================
-- GOPAQ CORE LOGISTICS PLATFORM SCHEMA
-- Multi-Tenant, Relational, SQLite & PostgreSQL Compatible
-- ==========================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tax_id TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'DOP',
  country TEXT DEFAULT 'DO',
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  manager_name TEXT,
  latitude REAL,
  longitude REAL,
  is_hub INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  branch_id TEXT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  capacity_m3 REAL DEFAULT 1000,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS warehouse_zones (
  id TEXT PRIMARY KEY,
  warehouse_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'storage',
  rack TEXT,
  bin TEXT,
  capacity INTEGER DEFAULT 100,
  current_count INTEGER DEFAULT 0,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  branch_id TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  branch_id TEXT,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  rnc_tax_id TEXT,
  tier TEXT DEFAULT 'Standard',
  credit_limit REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  cod_pending_balance REAL DEFAULT 0,
  addresses_json TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  branch_id TEXT,
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  current_lat REAL,
  current_lng REAL,
  speed REAL DEFAULT 0,
  heading REAL DEFAULT 0,
  battery REAL DEFAULT 100,
  rating REAL DEFAULT 5.0,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  branch_id TEXT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  plate TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  capacity_kg REAL NOT NULL,
  capacity_m3 REAL,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS dangerous_zones (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  surcharge_amount REAL DEFAULT 0,
  restriction_policy TEXT NOT NULL,
  polygon_geojson TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rates_matrix (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  service_type TEXT NOT NULL,
  origin_zone TEXT NOT NULL,
  dest_zone TEXT NOT NULL,
  base_rate REAL NOT NULL,
  per_kg_rate REAL NOT NULL,
  per_vol_rate REAL NOT NULL,
  min_charge REAL NOT NULL,
  currency TEXT DEFAULT 'DOP',
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  branch_id TEXT,
  client_id TEXT,
  tracking_number TEXT UNIQUE NOT NULL,
  external_tracking TEXT,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  origin_json TEXT NOT NULL,
  destination_json TEXT NOT NULL,
  package_json TEXT NOT NULL,
  pricing_json TEXT NOT NULL,
  shipping_cost REAL NOT NULL,
  currency TEXT DEFAULT 'DOP',
  cod_amount REAL DEFAULT 0,
  cod_currency TEXT DEFAULT 'DOP',
  cod_collected INTEGER DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  assigned_driver_id TEXT,
  assigned_route_id TEXT,
  current_location_json TEXT,
  label_url TEXT,
  pod_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS shipment_events (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT NOT NULL,
  actor_type TEXT,
  actor_id TEXT,
  extra_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  branch_id TEXT,
  driver_id TEXT,
  vehicle_id TEXT,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  total_stops INTEGER DEFAULT 0,
  completed_stops INTEGER DEFAULT 0,
  distance_km REAL DEFAULT 0,
  estimated_duration_min INTEGER DEFAULT 0,
  polyline_geojson TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS route_stops (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  shipment_id TEXT,
  sequence_order INTEGER NOT NULL,
  type TEXT NOT NULL,
  address_json TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  status TEXT DEFAULT 'pending',
  eta TEXT,
  completed_at TEXT,
  notes TEXT,
  pod_json TEXT,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS international_lockers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  locker_code TEXT UNIQUE NOT NULL,
  us_address TEXT,
  es_address TEXT,
  it_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS international_packages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  locker_id TEXT,
  client_id TEXT,
  tracking_number TEXT UNIQUE NOT NULL,
  origin_country TEXT NOT NULL,
  merchant_name TEXT,
  description TEXT NOT NULL,
  declared_value_usd REAL DEFAULT 0,
  weight_lbs REAL NOT NULL,
  volumetric_weight_lbs REAL,
  status TEXT DEFAULT 'received_miami',
  prealert_at TEXT,
  warehouse_location TEXT,
  photos_json TEXT,
  consolidation_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (locker_id) REFERENCES international_lockers(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS international_consolidations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  master_tracking TEXT UNIQUE NOT NULL,
  packages_count INTEGER NOT NULL,
  total_weight_lbs REAL NOT NULL,
  status TEXT DEFAULT 'consolidated',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS moving_orders (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  client_id TEXT,
  tracking_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'quote',
  origin_json TEXT NOT NULL,
  destination_json TEXT NOT NULL,
  moving_date TEXT NOT NULL,
  volume_m3 REAL NOT NULL,
  floors INTEGER DEFAULT 1,
  elevator INTEGER DEFAULT 0,
  crew_count INTEGER DEFAULT 2,
  vehicle_type TEXT NOT NULL,
  estimated_cost REAL NOT NULL,
  currency TEXT DEFAULT 'DOP',
  inventory_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS heavy_cargo_orders (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  client_id TEXT,
  tracking_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  cargo_type TEXT NOT NULL,
  pallets_count INTEGER DEFAULT 1,
  total_weight_kg REAL NOT NULL,
  dimensions_json TEXT NOT NULL,
  equipment_required TEXT,
  origin_json TEXT NOT NULL,
  destination_json TEXT NOT NULL,
  cost REAL NOT NULL,
  currency TEXT DEFAULT 'DOP',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cod_transactions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  shipment_id TEXT NOT NULL,
  driver_id TEXT,
  branch_id TEXT,
  client_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'DOP',
  method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'pending_collection',
  collected_at TEXT,
  received_branch_at TEXT,
  received_branch_by TEXT,
  reconciled_at TEXT,
  reconciled_by TEXT,
  settled_at TEXT,
  settlement_reference TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  client_id TEXT,
  key_name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  mode TEXT DEFAULT 'live',
  scopes TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  client_id TEXT,
  target_url TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  events TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  failure_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  event TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  response_code INTEGER,
  response_body TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_automation_rules (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  condition_json TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_payload_json TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_automation_logs (
  id TEXT PRIMARY KEY,
  rule_id TEXT,
  trigger_event TEXT NOT NULL,
  shipment_id TEXT,
  execution_status TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (rule_id) REFERENCES ai_automation_rules(id) ON DELETE SET NULL
);

-- Indexes for maximum performance
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_org_status ON shipments(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_routes_org_driver ON routes(organization_id, driver_id);
CREATE INDEX IF NOT EXISTS idx_users_org_email ON users(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_cod_org_status ON cod_transactions(organization_id, status);
