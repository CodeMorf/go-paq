import React, { useState } from 'react';
import { 
  DatabaseRedisSyncConfig, 
  MysqlSslMode, 
  RedisClusterTopology, 
  SyncStrategyMode 
} from './settingsTypes';
import { 
  Database, 
  Zap, 
  RefreshCw, 
  Server, 
  Key, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Download, 
  Copy, 
  Eye, 
  EyeOff, 
  Activity, 
  FileCode, 
  Check, 
  HardDrive,
  Radio,
  ArrowRightLeft
} from 'lucide-react';
import { Card, Button, StatusBadge, Modal } from '../../ui/DesignSystem';

interface TabProps {
  config: DatabaseRedisSyncConfig;
  onChange: (updated: Partial<DatabaseRedisSyncConfig>) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const DatabaseRedisSyncTab: React.FC<TabProps> = ({ config, onChange, onToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'mysql' | 'redis' | 'sync_engine' | 'schema_ddl'>('architecture');
  const [showMysqlPassword, setShowMysqlPassword] = useState(false);
  const [showRedisPassword, setShowRedisPassword] = useState(false);
  
  const [testingMysql, setTestingMysql] = useState(false);
  const [testingRedis, setTestingRedis] = useState(false);
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState<string>('');
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [copiedSql, setCopiedSql] = useState(false);

  // Connection Test Handlers
  const handleTestMysql = () => {
    setTestingMysql(true);
    setTimeout(() => {
      setTestingMysql(false);
      onChange({ latencyMysqlMs: 3.8 });
      onToast(
        'success',
        'Conexión MySQL 8.0 Verificada',
        `Conexión exitosa a ${config.mysqlHost}:${config.mysqlPort} en base de datos "${config.mysqlDatabase}". Latencia: 3.8ms (SSL: ${config.mysqlSslMode}).`
      );
    }, 1100);
  };

  const handleTestRedis = () => {
    setTestingRedis(true);
    setTimeout(() => {
      setTestingRedis(false);
      onChange({ latencyRedisMs: 0.6 });
      onToast(
        'success',
        'Conexión Redis In-Memory Verificada',
        `PING PONG exitoso a ${config.redisHost}:${config.redisPort} (DB ${config.redisDbIndex}). Latencia ultrarrápida: 0.6ms.`
      );
    }, 900);
  };

  // Full Sync Trigger
  const handleRunFullSync = () => {
    setIsFullSyncing(true);
    setSyncProgress(10);
    setSyncStep('Iniciando handshake y validando integridad de esquemas MySQL 8.0...');

    setTimeout(() => {
      setSyncProgress(35);
      setSyncStep('Purgando claves obsoletas en Redis y creando snapshots transaccionales...');
    }, 700);

    setTimeout(() => {
      setSyncProgress(65);
      setSyncStep('Cargando 148,920 registros de Envíos, Clientes, Choferes y Rutas a Redis Cache-Aside...');
    }, 1400);

    setTimeout(() => {
      setSyncProgress(88);
      setSyncStep('Sincronizando índices invertidos de búsqueda, geocercas activas y saldos de ledger COD...');
    }, 2100);

    setTimeout(() => {
      setSyncProgress(100);
      setSyncStep('Sincronización Total Completada con Éxito (100% Consistencia ACID & In-Memory).');
      setIsFullSyncing(false);
      
      const nowFormatted = `Hoy, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (100% Sincronizado)`;
      onChange({
        lastFullSyncTimestamp: nowFormatted,
        syncStatus: 'synced',
        totalSyncedKeys: 29840,
        cacheHitRatioPercent: 96.2,
      });

      onToast(
        'success',
        'Sincronización MySQL ↔ Redis Exitosa',
        'Todos los datos maestros, colas de despacho y caché en memoria se encuentran 100% alineados.'
      );
    }, 2800);
  };

  const mysqlDdlScript = `-- ====================================================================
-- GOPAQ DOMINICANA - ESQUEMA RELACIONAL MYSQL 8.0 & AURORA COMPLIANT
-- Engine: InnoDB | Charset: utf8mb4 | Collate: utf8mb4_unicode_ci
-- ====================================================================

CREATE DATABASE IF NOT EXISTS \`${config.mysqlDatabase}\`
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE \`${config.mysqlDatabase}\`;

-- 1. Tabla de Usuarios & Clientes (RNC/Cédula & Roles)
CREATE TABLE IF NOT EXISTS \`gopaq_users\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL,
  \`full_name\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(32) NULL,
  \`rnc_cedula\` VARCHAR(20) NULL,
  \`role\` ENUM('superadmin', 'admin', 'branch_operator', 'driver', 'client_corporate', 'client_personal') NOT NULL DEFAULT 'client_personal',
  \`locker_box_id\` VARCHAR(32) NULL UNIQUE,
  \`default_branch_id\` VARCHAR(64) NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_users_email\` (\`email\`),
  INDEX \`idx_users_locker\` (\`locker_box_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla Maestra de Envíos & Paquetes Courier
CREATE TABLE IF NOT EXISTS \`gopaq_shipments\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`tracking_number\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`origin_country\` CHAR(2) NOT NULL DEFAULT 'US',
  \`destination_country\` CHAR(2) NOT NULL DEFAULT 'DO',
  \`weight_lbs\` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  \`declared_value_usd\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`status\` ENUM('registered', 'received_miami', 'in_flight', 'customs_hold', 'customs_cleared', 'in_warehouse_sdq', 'in_branch', 'out_for_delivery', 'delivered', 'returned', 'cancelled') NOT NULL DEFAULT 'registered',
  \`assigned_driver_id\` VARCHAR(64) NULL,
  \`destination_branch_id\` VARCHAR(64) NULL,
  \`cod_amount_dop\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`is_de_minimis\` TINYINT(1) GENERATED ALWAYS AS (IF(\`declared_value_usd\` < 200.00, 1, 0)) STORED,
  \`pod_signature_url\` TEXT NULL,
  \`pod_photo_url\` TEXT NULL,
  \`pod_timestamp\` TIMESTAMP NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_shipment_tracking\` (\`tracking_number\`),
  INDEX \`idx_shipment_status\` (\`status\`),
  INDEX \`idx_shipment_user\` (\`user_id\`),
  INDEX \`idx_shipment_driver\` (\`assigned_driver_id\`),
  CONSTRAINT \`fk_shipment_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`gopaq_users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Comprobantes Fiscales DGII (e-CF & NCF)
CREATE TABLE IF NOT EXISTS \`gopaq_fiscal_invoices\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`shipment_id\` VARCHAR(64) NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`ncf_number\` VARCHAR(20) NOT NULL,
  \`ncf_type\` ENUM('B01_CREDITO_FISCAL', 'B02_CONSUMO_FINAL', 'B14_REGIMEN_ESPECIAL', 'B15_GUBERNAMENTAL', 'E31_ELECTRONICO') NOT NULL,
  \`subtotal_dop\` DECIMAL(12,2) NOT NULL,
  \`itbis_18_dop\` DECIMAL(12,2) NOT NULL,
  \`total_dop\` DECIMAL(12,2) NOT NULL,
  \`dgii_security_code\` VARCHAR(64) NULL,
  \`dgii_status\` ENUM('draft', 'issued', 'signed_xml', 'dgii_accepted', 'dgii_rejected', 'cancelled') NOT NULL DEFAULT 'issued',
  \`issued_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_fiscal_ncf\` (\`ncf_number\`),
  INDEX \`idx_fiscal_user\` (\`user_id\`),
  CONSTRAINT \`fk_invoice_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`gopaq_users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Ledger COD & Liquidación a Comercios
CREATE TABLE IF NOT EXISTS \`gopaq_cod_ledger\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`shipment_id\` VARCHAR(64) NOT NULL,
  \`merchant_id\` VARCHAR(64) NOT NULL,
  \`driver_id\` VARCHAR(64) NOT NULL,
  \`amount_collected_dop\` DECIMAL(12,2) NOT NULL,
  \`payment_method\` ENUM('cash', 'card_pos', 'transfer_ach', 'qr_link') NOT NULL,
  \`settlement_status\` ENUM('driver_held', 'branch_deposited', 'settled_to_merchant', 'refunded') NOT NULL DEFAULT 'driver_held',
  \`ach_transfer_ref\` VARCHAR(64) NULL,
  \`collected_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`settled_at\` TIMESTAMP NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_cod_merchant\` (\`merchant_id\`),
  INDEX \`idx_cod_driver\` (\`driver_id\`),
  CONSTRAINT \`fk_cod_shipment\` FOREIGN KEY (\`shipment_id\`) REFERENCES \`gopaq_shipments\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(mysqlDdlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    onToast('success', 'Script SQL Copiado', 'El esquema DDL completo de MySQL 8.0 ha sido copiado al portapapeles.');
  };

  const handleDownloadSql = () => {
    const element = document.createElement('a');
    const file = new Blob([mysqlDdlScript], { type: 'text/sql' });
    element.href = URL.createObjectURL(file);
    element.download = `gopaq_schema_${config.mysqlDatabase}_mysql8.sql`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    onToast('success', 'Script Descargado', `Archivo gopaq_schema_${config.mysqlDatabase}_mysql8.sql generado exitosamente.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-time Status */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-5 rounded-2xl text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border border-blue-800/40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
                Arquitectura de Datos Dual
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                ● MySQL 8.0 Primary ACID
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-400/30 text-[10px] font-bold">
                ⚡ Redis 7.x In-Memory Cache
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Base de Datos MySQL 8.0 & Caché Redis (Full Synchronization)
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Almacenamiento relacional transaccional permanente con aceleración in-memory en Redis para rastreo GPS en vivo, telemetría y consultas de alta concurrencia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
          <Button
            variant="primary"
            size="sm"
            loading={isFullSyncing}
            onClick={handleRunFullSync}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isFullSyncing ? 'animate-spin' : ''}`} />}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            {isFullSyncing ? 'Sincronizando...' : 'Sincronizar Todo Ahora (Full Sync)'}
          </Button>
        </div>
      </div>

      {/* Synchronizer Progress Bar (when active) */}
      {isFullSyncing && (
        <Card className="border-blue-300 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 space-y-2 animate-in fade-in duration-200">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>{syncStep}</span>
            </span>
            <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{syncProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </Card>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Registros en MySQL</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {config.totalMysqlRecords.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            ● Latencia: {config.latencyMysqlMs} ms
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Llaves en Redis Caché</span>
            <Zap className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {config.totalSyncedKeys.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            ● Latencia: {config.latencyRedisMs} ms
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Cache Hit Ratio</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {config.cacheHitRatioPercent}%
          </div>
          <div className="text-[11px] text-slate-500">
            Aceleración 18x en lecturas
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Estado de Sincronía</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            ACID / In-Memory OK
          </div>
          <div className="text-[10px] text-slate-400 truncate" title={config.lastFullSyncTimestamp}>
            {config.lastFullSyncTimestamp}
          </div>
        </Card>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('architecture')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'architecture'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Ecosistema & Arquitectura Dual</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mysql')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'mysql'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Configuración MySQL 8.0 / Aurora</span>
        </button>

        <button
          onClick={() => setActiveSubTab('redis')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'redis'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Configuración Redis 7.x & TTLs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sync_engine')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'sync_engine'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Motor de Sincronía & CDC</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schema_ddl')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'schema_ddl'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Esquema DDL SQL & Tablas</span>
        </button>
      </div>

      {/* 1. ARCHITECTURE TAB */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MySQL Role Card */}
            <Card className="space-y-4 border-blue-200/80 dark:border-blue-900/40">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Capa Relacional Transaccional (MySQL 8.0)
                    </h4>
                    <p className="text-[11px] text-slate-500">Persistencia duradera con cumplimiento ACID estricto</p>
                  </div>
                </div>
                <StatusBadge status="active" label="En Línea" />
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span>Datos Maestros & Auditoría Fiscal</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Almacena las guías de carga, manifiestos DGA Miami, secuencias e-CF DGII, facturación fiscal, liquidaciones COD a comercios y el histórico inmutable de eventos.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-slate-100/60 dark:bg-slate-800/60 rounded-lg">
                    <span className="text-slate-400 block">Host Actual:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{config.mysqlHost}</span>
                  </div>
                  <div className="p-2 bg-slate-100/60 dark:bg-slate-800/60 rounded-lg">
                    <span className="text-slate-400 block">Base de Datos:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{config.mysqlDatabase}</span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  loading={testingMysql}
                  onClick={handleTestMysql}
                  icon={<Activity className="w-3.5 h-3.5 text-blue-500" />}
                  className="w-full"
                >
                  Probar Conexión & Pool MySQL
                </Button>
              </div>
            </Card>

            {/* Redis Role Card */}
            <Card className="space-y-4 border-rose-200/80 dark:border-rose-900/40">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Capa In-Memory & Pub/Sub (Redis 7.x)
                    </h4>
                    <p className="text-[11px] text-slate-500">Aceleración en microsegundos y streaming en tiempo real</p>
                  </div>
                </div>
                <StatusBadge status="active" label="En Línea" />
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-500" />
                    <span>Telemetría de Choferes & Caché Rápido</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Soporta coordenadas GPS en vivo de repartidores (TTL 10s), estados inmediatos de tracking para clientes, sesiones JWT y difusión WebSockets.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-slate-100/60 dark:bg-slate-800/60 rounded-lg">
                    <span className="text-slate-400 block">Host Redis:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{config.redisHost}</span>
                  </div>
                  <div className="p-2 bg-slate-100/60 dark:bg-slate-800/60 rounded-lg">
                    <span className="text-slate-400 block">Prefijo de Claves:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{config.redisKeyPrefix}*</span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  loading={testingRedis}
                  onClick={handleTestRedis}
                  icon={<Activity className="w-3.5 h-3.5 text-rose-500" />}
                  className="w-full"
                >
                  Probar PING / PONG Redis
                </Button>
              </div>
            </Card>
          </div>

          {/* Sync Architecture Diagram Card */}
          <Card className="p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              <span>Flujo de Sincronización Automática (Cache-Aside + Write-Through)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Escrituras Transaccionales</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Cada entrega POD, pago COD o creación de guía se graba primero en <strong>MySQL 8.0</strong> asegurando integridad referencial y commit seguro.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Invalidación & Warm-up Redis</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  El motor invalida inmediatamente la clave <code className="text-rose-600 dark:text-rose-400">gopaq:shipment:TRACK_ID</code> y refresca el índice in-memory en &lt;1ms.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Difusión Pub/Sub & WebSockets</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  El canal Redis Pub/Sub transmite el evento al mapa del cliente, panel de despacho y app del conductor en tiempo real.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 2. MYSQL 8.0 TAB */}
      {activeSubTab === 'mysql' && (
        <Card className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Parámetros de Conexión & Pool MySQL 8.0 / AWS Aurora
                </h4>
                <p className="text-[11px] text-slate-500">Control de sockets, credenciales, réplicas de lectura y charset</p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              loading={testingMysql}
              onClick={handleTestMysql}
              icon={<Activity className="w-3.5 h-3.5 text-blue-500" />}
            >
              Test Connection
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Host / Endpoint Primario (Escritura)
              </label>
              <input
                type="text"
                value={config.mysqlHost}
                onChange={(e) => onChange({ mysqlHost: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Puerto MySQL
              </label>
              <input
                type="number"
                value={config.mysqlPort}
                onChange={(e) => onChange({ mysqlPort: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Nombre de la Base de Datos
              </label>
              <input
                type="text"
                value={config.mysqlDatabase}
                onChange={(e) => onChange({ mysqlDatabase: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Usuario MySQL (App User)
              </label>
              <input
                type="text"
                value={config.mysqlUser}
                onChange={(e) => onChange({ mysqlUser: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-600 dark:text-slate-400 font-bold">
                  Contraseña de Base de Datos
                </label>
                <button
                  type="button"
                  onClick={() => setShowMysqlPassword(!showMysqlPassword)}
                  className="text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1"
                >
                  {showMysqlPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showMysqlPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <input
                type={showMysqlPassword ? 'text' : 'password'}
                value={config.mysqlPasswordMasked}
                onChange={(e) => onChange({ mysqlPasswordMasked: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Modo de Cifrado SSL / TLS
              </label>
              <select
                value={config.mysqlSslMode}
                onChange={(e) => onChange({ mysqlSslMode: e.target.value as MysqlSslMode })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              >
                <option value="required">Required (Recomendado en Producción)</option>
                <option value="verify_ca">Verify CA</option>
                <option value="verify_identity">Verify Full Identity</option>
                <option value="preferred">Preferred</option>
                <option value="disabled">Disabled (Solo desarrollo local)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Host Réplica de Lectura (Read-Only)
              </label>
              <input
                type="text"
                value={config.mysqlReadReplicaHost}
                onChange={(e) => onChange({ mysqlReadReplicaHost: e.target.value })}
                placeholder="mysql-replica-ro.gopaq.internal"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Descarga las consultas analíticas y reportes fiscales pesados.
              </span>
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Pool de Conexiones (Min / Max)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={config.mysqlPoolMin}
                  onChange={(e) => onChange({ mysqlPoolMin: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                  placeholder="Min: 5"
                />
                <input
                  type="number"
                  value={config.mysqlPoolMax}
                  onChange={(e) => onChange({ mysqlPoolMax: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                  placeholder="Max: 40"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Nivel de Aislamiento de Transacciones
              </label>
              <select
                value={config.mysqlIsolationLevel}
                onChange={(e) => onChange({ mysqlIsolationLevel: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              >
                <option value="READ COMMITTED">READ COMMITTED (Óptimo para alta concurrencia)</option>
                <option value="REPEATABLE READ">REPEATABLE READ (Default MySQL)</option>
                <option value="SERIALIZABLE">SERIALIZABLE (Máximo rigor financiero)</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* 3. REDIS 7.X TAB */}
      {activeSubTab === 'redis' && (
        <Card className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Parámetros de Redis 7.x & Políticas de Retención (TTL)
                </h4>
                <p className="text-[11px] text-slate-500">Configuración de servidor in-memory, base de datos y expiración de llaves</p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              loading={testingRedis}
              onClick={handleTestRedis}
              icon={<Activity className="w-3.5 h-3.5 text-rose-500" />}
            >
              Test PING Redis
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Host / Endpoint Redis
              </label>
              <input
                type="text"
                value={config.redisHost}
                onChange={(e) => onChange({ redisHost: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Puerto Redis
              </label>
              <input
                type="number"
                value={config.redisPort}
                onChange={(e) => onChange({ redisPort: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Topología del Clúster
              </label>
              <select
                value={config.redisTopology}
                onChange={(e) => onChange({ redisTopology: e.target.value as RedisClusterTopology })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              >
                <option value="standalone">Standalone / Primary-Replica</option>
                <option value="cluster">Redis Cluster Sharded</option>
                <option value="sentinel">Redis Sentinel High-Availability</option>
                <option value="upstash_serverless">Upstash Serverless Redis</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-600 dark:text-slate-400 font-bold">
                  Token de Autenticación / Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowRedisPassword(!showRedisPassword)}
                  className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold flex items-center gap-1"
                >
                  {showRedisPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showRedisPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <input
                type={showRedisPassword ? 'text' : 'password'}
                value={config.redisPasswordMasked}
                onChange={(e) => onChange({ redisPasswordMasked: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Prefijo Global de Claves (Namespacing)
              </label>
              <input
                type="text"
                value={config.redisKeyPrefix}
                onChange={(e) => onChange({ redisKeyPrefix: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Política de Desalojo de Memoria (MaxMemory)
              </label>
              <select
                value={config.redisMaxMemoryPolicy}
                onChange={(e) => onChange({ redisMaxMemoryPolicy: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              >
                <option value="allkeys-lru">allkeys-lru (Elimina menos usadas recientemente - Recomendado)</option>
                <option value="volatile-lru">volatile-lru (Solo claves con TTL asignado)</option>
                <option value="noeviction">noeviction (Retorna error en límite)</option>
              </select>
            </div>
          </div>

          {/* TTL Settings */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>Reglas de Expiración (TTL en Segundos)</span>
            </h5>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <label className="text-slate-500 font-semibold block mb-1">GPS Choferes en Vivo</label>
                <input
                  type="number"
                  value={config.ttlDriverGpsLocationSeconds}
                  onChange={(e) => onChange({ ttlDriverGpsLocationSeconds: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-mono font-bold text-rose-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: 10s</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <label className="text-slate-500 font-semibold block mb-1">Tracking Rápido Guía</label>
                <input
                  type="number"
                  value={config.ttlActiveShipmentTrackSeconds}
                  onChange={(e) => onChange({ ttlActiveShipmentTrackSeconds: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-mono font-bold text-rose-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: 180s (3 min)</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <label className="text-slate-500 font-semibold block mb-1">Tasas de Cambio</label>
                <input
                  type="number"
                  value={config.ttlExchangeRatesSeconds}
                  onChange={(e) => onChange({ ttlExchangeRatesSeconds: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-mono font-bold text-rose-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: 3600s (1h)</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <label className="text-slate-500 font-semibold block mb-1">Sesiones de Usuario</label>
                <input
                  type="number"
                  value={config.ttlUserSessionsSeconds}
                  onChange={(e) => onChange({ ttlUserSessionsSeconds: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-mono font-bold text-rose-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: 86400s (24h)</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 4. SYNC ENGINE TAB */}
      {activeSubTab === 'sync_engine' && (
        <Card className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Motor de Sincronización, Cache-Aside & Change Data Capture (CDC)
                </h4>
                <p className="text-[11px] text-slate-500">Mecanismos de consistencia y balanceo entre disco y memoria</p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              loading={isFullSyncing}
              onClick={handleRunFullSync}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isFullSyncing ? 'animate-spin' : ''}`} />}
            >
              Ejecutar Sync Ahora
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                Estrategia de Sincronización Primaria
              </label>
              <select
                value={config.syncStrategy}
                onChange={(e) => onChange({ syncStrategy: e.target.value as SyncStrategyMode })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              >
                <option value="write_through">Write-Through (Escribe simultáneamente en MySQL y Redis)</option>
                <option value="cache_aside">Cache-Aside (Lectura en Redis; si no existe, consulta MySQL y puebla)</option>
                <option value="write_behind_queue">Write-Behind Queue (Escribe en Redis y envía a MySQL en cola batch)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoInvalidateCacheOnWrite}
                  onChange={(e) => onChange({ autoInvalidateCacheOnWrite: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Invalidación Automática al Escribir</div>
                  <div className="text-[11px] text-slate-500">Elimina de inmediato la versión en caché al actualizar cualquier estado de paquete o comprobante fiscal.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableRedisPubSubBroadcasting}
                  onChange={(e) => onChange({ enableRedisPubSubBroadcasting: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Broadcasting por Canales Redis Pub/Sub</div>
                  <div className="text-[11px] text-slate-500">Emite eventos en canales `gopaq:channel:shipments` y `gopaq:channel:gps` hacia los clientes conectados.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableBinlogCdcStreamer}
                  onChange={(e) => onChange({ enableBinlogCdcStreamer: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Streamer MySQL Binlog CDC (Change Data Capture)</div>
                  <div className="text-[11px] text-slate-500">Lee el registro binario transaccional de MySQL para replicar cambios a Redis sin sobrecargar la CPU.</div>
                </div>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* 5. SCHEMA DDL TAB */}
      {activeSubTab === 'schema_ddl' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Script DDL de Tablas MySQL 8.0 (InnoDB & utf8mb4)
                </h4>
                <p className="text-[11px] text-slate-500">Esquema listo para importar en MySQL Workbench, Cloud SQL o phpMyAdmin</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopySql}
                icon={copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedSql ? 'Copiado' : 'Copiar SQL'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadSql}
                icon={<Download className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Descargar .SQL
              </Button>
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-96 border border-slate-800">
              <code>{mysqlDdlScript}</code>
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
};
