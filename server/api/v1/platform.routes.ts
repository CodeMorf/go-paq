import { Router } from 'express';
import crypto from 'crypto';
import { authenticate, AuthenticatedRequest, requireRole } from '../../auth/middleware';
import { queryAllAsync, queryOneAsync, executeAsync } from '../../db/database';

export const platformRouter = Router();

async function ensurePlatformTables() {
  await executeAsync(`CREATE TABLE IF NOT EXISTS platform_settings (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    namespace TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    updated_by TEXT,
    updated_at TEXT NOT NULL
  )`);
  await executeAsync(`CREATE TABLE IF NOT EXISTS platform_notifications (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    read_at TEXT,
    created_at TEXT NOT NULL
  )`);
  await executeAsync(`CREATE INDEX IF NOT EXISTS idx_platform_settings_org_ns ON platform_settings(organization_id, namespace)`);
  await executeAsync(`CREATE INDEX IF NOT EXISTS idx_platform_notifications_org ON platform_notifications(organization_id, created_at)`);
}

const safeJson = <T>(value: any, fallback: T): T => {
  try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
};

platformRouter.get('/bootstrap', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    await ensurePlatformTables();
    const orgId = req.organizationId!;
    const [shipments, routes, drivers, vehicles, branches, clients, dangerousZones, rates, automationRules, automationLogs, notifications, settings] = await Promise.all([
      queryAllAsync(`SELECT * FROM shipments WHERE organization_id=? ORDER BY created_at DESC LIMIT 500`, [orgId]),
      queryAllAsync(`SELECT * FROM routes WHERE organization_id=? ORDER BY date DESC LIMIT 200`, [orgId]),
      queryAllAsync(`SELECT * FROM drivers WHERE organization_id=? AND active=1 ORDER BY name`, [orgId]),
      queryAllAsync(`SELECT * FROM vehicles WHERE organization_id=? ORDER BY created_at DESC`, [orgId]),
      queryAllAsync(`SELECT * FROM branches WHERE organization_id=? AND active=1 ORDER BY is_hub DESC, name`, [orgId]),
      queryAllAsync(`SELECT * FROM clients WHERE organization_id=? AND active=1 ORDER BY created_at DESC`, [orgId]),
      queryAllAsync(`SELECT * FROM dangerous_zones WHERE organization_id=? AND active=1 ORDER BY created_at DESC`, [orgId]),
      queryAllAsync(`SELECT * FROM rates_matrix WHERE organization_id=? AND active=1 ORDER BY created_at DESC`, [orgId]),
      queryAllAsync(`SELECT * FROM ai_automation_rules WHERE organization_id=? ORDER BY created_at DESC`, [orgId]),
      queryAllAsync(`SELECT l.* FROM ai_automation_logs l LEFT JOIN ai_automation_rules r ON r.id=l.rule_id WHERE r.organization_id=? OR l.rule_id IS NULL ORDER BY l.created_at DESC LIMIT 200`, [orgId]),
      queryAllAsync(`SELECT * FROM platform_notifications WHERE organization_id=? ORDER BY created_at DESC LIMIT 200`, [orgId]),
      queryAllAsync(`SELECT namespace,payload_json,updated_at FROM platform_settings WHERE organization_id=?`, [orgId])
    ]);
    const settingsMap = Object.fromEntries(settings.map((row: any) => [row.namespace, { ...safeJson(row.payload_json, {}), updatedAt: row.updated_at }]));
    return res.json({ success:true, data:{ shipments, routes, drivers, vehicles, branches, clients, dangerousZones, rates, automationRules, automationLogs, notifications, settings:settingsMap } });
  } catch (err) { next(err); }
});

platformRouter.get('/dashboard', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const orgId = req.organizationId!;
    const [shipments, delivered, routes, drivers, clients, cod] = await Promise.all([
      queryOneAsync<any>(`SELECT COUNT(*) count, COALESCE(SUM(shipping_cost),0) revenue FROM shipments WHERE organization_id=?`, [orgId]),
      queryOneAsync<any>(`SELECT COUNT(*) count FROM shipments WHERE organization_id=? AND status='delivered'`, [orgId]),
      queryOneAsync<any>(`SELECT COUNT(*) count FROM routes WHERE organization_id=? AND status IN ('active','dispatched','in_progress')`, [orgId]),
      queryOneAsync<any>(`SELECT COUNT(*) count FROM drivers WHERE organization_id=? AND active=1`, [orgId]),
      queryOneAsync<any>(`SELECT COUNT(*) count FROM clients WHERE organization_id=? AND active=1`, [orgId]),
      queryOneAsync<any>(`SELECT COALESCE(SUM(amount),0) pending FROM cod_transactions WHERE organization_id=? AND status NOT IN ('settled','cancelled')`, [orgId])
    ]);
    const total = Number(shipments?.count || 0);
    const deliveredCount = Number(delivered?.count || 0);
    return res.json({ success:true, kpis:{ totalShipments:total, deliveredShipments:deliveredCount, deliveryRate:total ? Math.round((deliveredCount/total)*10000)/100 : 0, revenue:Number(shipments?.revenue||0), activeRoutes:Number(routes?.count||0), activeDrivers:Number(drivers?.count||0), clients:Number(clients?.count||0), codPending:Number(cod?.pending||0) } });
  } catch (err) { next(err); }
});

platformRouter.get('/dangerous-zones', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try { return res.json({ success:true, zones:await queryAllAsync(`SELECT * FROM dangerous_zones WHERE organization_id=? AND active=1 ORDER BY created_at DESC`, [req.organizationId!]) }); } catch (err) { next(err); }
});
platformRouter.post('/dangerous-zones', authenticate, requireRole(['ADMIN','MANAGER','Owner']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, city, riskLevel='medium', surchargeAmount=0, restrictionPolicy='restricted', polygonGeojson=null } = req.body;
    if (!name || !city) return res.status(400).json({success:false,error:'name y city son obligatorios.'});
    const id=`zone-${crypto.randomBytes(6).toString('hex')}`, now=new Date().toISOString();
    await executeAsync(`INSERT INTO dangerous_zones (id,organization_id,name,city,risk_level,surcharge_amount,restriction_policy,polygon_geojson,active,created_at) VALUES (?,?,?,?,?,?,?,?,1,?)`, [id,req.organizationId!,name,city,riskLevel,Number(surchargeAmount)||0,restrictionPolicy,typeof polygonGeojson==='string'?polygonGeojson:JSON.stringify(polygonGeojson),now]);
    return res.status(201).json({success:true,zone:await queryOneAsync(`SELECT * FROM dangerous_zones WHERE id=? AND organization_id=?`,[id,req.organizationId!])});
  } catch (err) { next(err); }
});
platformRouter.patch('/dangerous-zones/:id', authenticate, requireRole(['ADMIN','MANAGER','Owner']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const current:any=await queryOneAsync(`SELECT * FROM dangerous_zones WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!]);
    if(!current) return res.status(404).json({success:false,error:'Zona no encontrada.'});
    const b=req.body;
    await executeAsync(`UPDATE dangerous_zones SET name=?,city=?,risk_level=?,surcharge_amount=?,restriction_policy=?,polygon_geojson=?,active=? WHERE id=? AND organization_id=?`,[b.name??current.name,b.city??current.city,b.riskLevel??current.risk_level,Number(b.surchargeAmount??current.surcharge_amount),b.restrictionPolicy??current.restriction_policy,b.polygonGeojson===undefined?current.polygon_geojson:(typeof b.polygonGeojson==='string'?b.polygonGeojson:JSON.stringify(b.polygonGeojson)),b.active===undefined?current.active:(b.active?1:0),req.params.id,req.organizationId!]);
    return res.json({success:true,zone:await queryOneAsync(`SELECT * FROM dangerous_zones WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!])});
  } catch(err){next(err);}
});
platformRouter.delete('/dangerous-zones/:id', authenticate, requireRole(['ADMIN','MANAGER','Owner']), async (req: AuthenticatedRequest,res,next)=>{try{const r=await executeAsync(`UPDATE dangerous_zones SET active=0 WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!]);if(!r.changes)return res.status(404).json({success:false,error:'Zona no encontrada.'});return res.json({success:true});}catch(err){next(err);}});

platformRouter.get('/rates', authenticate, async (req: AuthenticatedRequest,res,next)=>{try{return res.json({success:true,rates:await queryAllAsync(`SELECT * FROM rates_matrix WHERE organization_id=? AND active=1 ORDER BY created_at DESC`,[req.organizationId!])});}catch(err){next(err);}});
platformRouter.post('/rates', authenticate, requireRole(['ADMIN','MANAGER','Owner']), async (req: AuthenticatedRequest,res,next)=>{try{const b=req.body;if(!b.serviceType||!b.originZone||!b.destZone)return res.status(400).json({success:false,error:'serviceType, originZone y destZone son obligatorios.'});const id=`rate-${crypto.randomBytes(6).toString('hex')}`,now=new Date().toISOString();await executeAsync(`INSERT INTO rates_matrix (id,organization_id,service_type,origin_zone,dest_zone,base_rate,per_kg_rate,per_vol_rate,min_charge,currency,active,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,?)`,[id,req.organizationId!,b.serviceType,b.originZone,b.destZone,Number(b.baseRate)||0,Number(b.perKgRate)||0,Number(b.perVolRate)||0,Number(b.minCharge)||0,b.currency||'DOP',now]);return res.status(201).json({success:true,rate:await queryOneAsync(`SELECT * FROM rates_matrix WHERE id=? AND organization_id=?`,[id,req.organizationId!])});}catch(err){next(err);}});
platformRouter.patch('/rates/:id', authenticate, requireRole(['ADMIN','MANAGER','Owner']), async (req: AuthenticatedRequest,res,next)=>{try{const c:any=await queryOneAsync(`SELECT * FROM rates_matrix WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!]);if(!c)return res.status(404).json({success:false,error:'Tarifa no encontrada.'});const b=req.body;await executeAsync(`UPDATE rates_matrix SET service_type=?,origin_zone=?,dest_zone=?,base_rate=?,per_kg_rate=?,per_vol_rate=?,min_charge=?,currency=?,active=? WHERE id=? AND organization_id=?`,[b.serviceType??c.service_type,b.originZone??c.origin_zone,b.destZone??c.dest_zone,Number(b.baseRate??c.base_rate),Number(b.perKgRate??c.per_kg_rate),Number(b.perVolRate??c.per_vol_rate),Number(b.minCharge??c.min_charge),b.currency??c.currency,b.active===undefined?c.active:(b.active?1:0),req.params.id,req.organizationId!]);return res.json({success:true,rate:await queryOneAsync(`SELECT * FROM rates_matrix WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!])});}catch(err){next(err);}});
platformRouter.delete('/rates/:id', authenticate, requireRole(['ADMIN','MANAGER','Owner']), async (req: AuthenticatedRequest,res,next)=>{try{const r=await executeAsync(`UPDATE rates_matrix SET active=0 WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!]);if(!r.changes)return res.status(404).json({success:false,error:'Tarifa no encontrada.'});return res.json({success:true});}catch(err){next(err);}});

platformRouter.get('/automations/rules', authenticate, async (req: AuthenticatedRequest,res,next)=>{try{return res.json({success:true,rules:await queryAllAsync(`SELECT * FROM ai_automation_rules WHERE organization_id=? ORDER BY created_at DESC`,[req.organizationId!])});}catch(err){next(err);}});
platformRouter.post('/automations/rules', authenticate, requireRole(['ADMIN','MANAGER','Owner']), async (req: AuthenticatedRequest,res,next)=>{try{const b=req.body;if(!b.name||!b.eventType||!b.actionType)return res.status(400).json({success:false,error:'name, eventType y actionType son obligatorios.'});const id=`rule-${crypto.randomBytes(6).toString('hex')}`,now=new Date().toISOString();await executeAsync(`INSERT INTO ai_automation_rules (id,organization_id,name,event_type,condition_json,action_type,action_payload_json,enabled,created_at) VALUES (?,?,?,?,?,?,?,?,?)`,[id,req.organizationId!,b.name,b.eventType,JSON.stringify(b.condition||{}),b.actionType,JSON.stringify(b.actionPayload||{}),b.enabled===false?0:1,now]);return res.status(201).json({success:true,rule:await queryOneAsync(`SELECT * FROM ai_automation_rules WHERE id=? AND organization_id=?`,[id,req.organizationId!])});}catch(err){next(err);}});
platformRouter.patch('/automations/rules/:id', authenticate, requireRole(['ADMIN','MANAGER','Owner']), async (req: AuthenticatedRequest,res,next)=>{try{const c:any=await queryOneAsync(`SELECT * FROM ai_automation_rules WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!]);if(!c)return res.status(404).json({success:false,error:'Regla no encontrada.'});const b=req.body;await executeAsync(`UPDATE ai_automation_rules SET name=?,event_type=?,condition_json=?,action_type=?,action_payload_json=?,enabled=? WHERE id=? AND organization_id=?`,[b.name??c.name,b.eventType??c.event_type,b.condition===undefined?c.condition_json:JSON.stringify(b.condition),b.actionType??c.action_type,b.actionPayload===undefined?c.action_payload_json:JSON.stringify(b.actionPayload),b.enabled===undefined?c.enabled:(b.enabled?1:0),req.params.id,req.organizationId!]);return res.json({success:true,rule:await queryOneAsync(`SELECT * FROM ai_automation_rules WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!])});}catch(err){next(err);}});
platformRouter.delete('/automations/rules/:id', authenticate, requireRole(['ADMIN','MANAGER','Owner']), async (req: AuthenticatedRequest,res,next)=>{try{const r=await executeAsync(`DELETE FROM ai_automation_rules WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!]);if(!r.changes)return res.status(404).json({success:false,error:'Regla no encontrada.'});return res.json({success:true});}catch(err){next(err);}});
platformRouter.get('/automations/logs', authenticate, async (req: AuthenticatedRequest,res,next)=>{try{return res.json({success:true,logs:await queryAllAsync(`SELECT l.* FROM ai_automation_logs l JOIN ai_automation_rules r ON r.id=l.rule_id WHERE r.organization_id=? ORDER BY l.created_at DESC LIMIT 500`,[req.organizationId!])});}catch(err){next(err);}});

platformRouter.get('/settings/:namespace', authenticate, async (req: AuthenticatedRequest,res,next)=>{try{await ensurePlatformTables();const row:any=await queryOneAsync(`SELECT * FROM platform_settings WHERE organization_id=? AND namespace=? ORDER BY updated_at DESC LIMIT 1`,[req.organizationId!,req.params.namespace]);return res.json({success:true,settings:row?safeJson(row.payload_json,{}):{},updatedAt:row?.updated_at||null});}catch(err){next(err);}});
platformRouter.put('/settings/:namespace', authenticate, requireRole(['ADMIN','MANAGER','Owner']), async (req: AuthenticatedRequest,res,next)=>{try{await ensurePlatformTables();const org=req.organizationId!,ns=req.params.namespace,now=new Date().toISOString(),id=`setting-${crypto.createHash('sha256').update(`${org}:${ns}`).digest('hex').slice(0,24)}`;const existing=await queryOneAsync(`SELECT id FROM platform_settings WHERE organization_id=? AND namespace=?`,[org,ns]);if(existing)await executeAsync(`UPDATE platform_settings SET payload_json=?,updated_by=?,updated_at=? WHERE organization_id=? AND namespace=?`,[JSON.stringify(req.body||{}),req.user?.userId||null,now,org,ns]);else await executeAsync(`INSERT INTO platform_settings (id,organization_id,namespace,payload_json,updated_by,updated_at) VALUES (?,?,?,?,?,?)`,[id,org,ns,JSON.stringify(req.body||{}),req.user?.userId||null,now]);return res.json({success:true,settings:req.body||{},updatedAt:now});}catch(err){next(err);}});

platformRouter.get('/notifications', authenticate, async (req: AuthenticatedRequest,res,next)=>{try{await ensurePlatformTables();return res.json({success:true,notifications:await queryAllAsync(`SELECT * FROM platform_notifications WHERE organization_id=? AND (user_id IS NULL OR user_id=?) ORDER BY created_at DESC LIMIT 200`,[req.organizationId!,req.user?.userId||''])});}catch(err){next(err);}});
platformRouter.patch('/notifications/:id/read', authenticate, async (req: AuthenticatedRequest,res,next)=>{try{await ensurePlatformTables();const r=await executeAsync(`UPDATE platform_notifications SET read_at=? WHERE id=? AND organization_id=?`,[new Date().toISOString(),req.params.id,req.organizationId!]);if(!r.changes)return res.status(404).json({success:false,error:'Notificación no encontrada.'});return res.json({success:true});}catch(err){next(err);}});
platformRouter.post('/notifications/read-all', authenticate, async (req: AuthenticatedRequest,res,next)=>{try{await ensurePlatformTables();await executeAsync(`UPDATE platform_notifications SET read_at=? WHERE organization_id=? AND read_at IS NULL AND (user_id IS NULL OR user_id=?)`,[new Date().toISOString(),req.organizationId!,req.user?.userId||'']);return res.json({success:true});}catch(err){next(err);}});
