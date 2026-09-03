import { Router } from 'express';
import { queryAllAsync, queryOneAsync } from '../../db/database';
import { asyncHandler } from '../../core/http';

export const geographyRouter = Router();

geographyRouter.get('/', asyncHandler(async (req, res) => {
  const iso2 = String(req.query.country || 'DO').trim().slice(0, 2).toUpperCase();
  const country = await queryOneAsync<any>('SELECT id, iso2, iso3, name, official_name FROM countries WHERE iso2 = ? AND active = 1', [iso2]);
  if (!country) return res.status(404).json({ success: false, error: 'País no encontrado.' });

  const provinceRows = await queryAllAsync<any>('SELECT id, code, name, capital, active FROM provinces WHERE country_id = ? AND active = 1 ORDER BY name ASC', [country.id]);
  const zoneRows = await queryAllAsync<any>(`SELECT id, province_id, code, name, zone_number, description FROM service_zones WHERE active = 1 AND province_id IN (${provinceRows.length ? provinceRows.map(() => '?').join(',') : "''"}) ORDER BY zone_number ASC`, provinceRows.map((province) => province.id));
  const provinces = provinceRows.map((province) => ({ ...province, zones: zoneRows.filter((zone) => zone.province_id === province.id).map((zone) => ({ id: zone.id, code: zone.code, name: zone.name, zoneNumber: zone.zone_number, description: zone.description })) }));
  return res.json({ success: true, country, provinces });
}));
