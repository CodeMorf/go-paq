import { Router } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole } from '../../auth/middleware';

export const vehiclesRouter = Router();

function serializeVehicle(row:any){return {...row,capacityKg:Number(row.capacity_kg||0),capacityM3:Number(row.capacity_m3||0),branchId:row.branch_id||'',fuelType:row.fuel_type||'gasolina',mileageKm:Number(row.mileage_km||0),lastMaintenanceDate:row.last_maintenance_date||'',currentDriverId:row.current_driver_id||undefined,currentDriverName:row.current_driver_name||undefined};}

vehiclesRouter.get('/', authenticate, (req:AuthenticatedRequest,res)=>{
  const rows=queryAll(`SELECT v.*, d.id AS current_driver_id, d.name AS current_driver_name, b.name AS branch_name FROM vehicles v LEFT JOIN drivers d ON d.vehicle_plate=v.plate AND d.organization_id=v.organization_id AND d.active=1 LEFT JOIN branches b ON b.id=v.branch_id WHERE v.organization_id=? ORDER BY v.created_at DESC`,[req.organizationId!]);
  res.json({success:true,vehicles:rows.map(serializeVehicle)});
});

vehiclesRouter.post('/', authenticate, requireRole(['ADMIN','MANAGER','Owner']), (req:AuthenticatedRequest,res)=>{
  const p=req.body||{};
  if(!p.plate||!p.brand||!p.model||!p.type||!Number(p.capacityKg)) return res.status(400).json({success:false,error:'Placa, marca, modelo, tipo y capacidad son obligatorios.'});
  const dup=queryOne(`SELECT id FROM vehicles WHERE organization_id=? AND plate=?`,[req.organizationId!,p.plate]);
  if(dup) return res.status(409).json({success:false,error:'Ya existe un vehículo con esa placa.'});
  const id=`veh-${crypto.randomBytes(5).toString('hex')}`;
  execute(`INSERT INTO vehicles (id,organization_id,branch_id,brand,model,year,plate,type,capacity_kg,capacity_m3,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`,[id,req.organizationId!,p.branchId||'br-sdq-central',p.brand,p.model,Number(p.year)||null,p.plate,p.type,Number(p.capacityKg),Number(p.capacityM3)||0,p.status||'active']);
  res.status(201).json({success:true,vehicle:serializeVehicle(queryOne(`SELECT * FROM vehicles WHERE id=? AND organization_id=?`,[id,req.organizationId!]))});
});

vehiclesRouter.patch('/:id', authenticate, requireRole(['ADMIN','MANAGER','Owner']), (req:AuthenticatedRequest,res)=>{
  const cur=queryOne<any>(`SELECT * FROM vehicles WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!]);
  if(!cur) return res.status(404).json({success:false,error:'Vehículo no encontrado.'});
  const p=req.body||{};
  execute(`UPDATE vehicles SET branch_id=?,brand=?,model=?,year=?,plate=?,type=?,capacity_kg=?,capacity_m3=?,status=? WHERE id=? AND organization_id=?`,[p.branchId??cur.branch_id,p.brand??cur.brand,p.model??cur.model,Number(p.year??cur.year)||null,p.plate??cur.plate,p.type??cur.type,Number(p.capacityKg??cur.capacity_kg),Number(p.capacityM3??cur.capacity_m3),p.status??cur.status,req.params.id,req.organizationId!]);
  res.json({success:true,vehicle:serializeVehicle(queryOne(`SELECT * FROM vehicles WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!]))});
});

vehiclesRouter.delete('/:id', authenticate, requireRole(['ADMIN','MANAGER','Owner']), (req:AuthenticatedRequest,res)=>{
  const result:any=execute(`UPDATE vehicles SET status='inactive' WHERE id=? AND organization_id=?`,[req.params.id,req.organizationId!]);
  if(!result?.changes) return res.status(404).json({success:false,error:'Vehículo no encontrado.'});
  res.json({success:true,message:'Vehículo desactivado correctamente.'});
});
