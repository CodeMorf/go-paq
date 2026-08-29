import { Router } from 'express';
import { queryOne, queryAll } from '../../db/database';

export const trackingRouter = Router();

// Public Real-Time Tracking Endpoint
trackingRouter.get('/:trackingNumber', (req, res) => {
  const { trackingNumber } = req.params;

  const shipment = queryOne(`
    SELECT s.*, b.name as branch_name, d.name as driver_name, d.phone as driver_phone
    FROM shipments s
    LEFT JOIN branches b ON s.branch_id = b.id
    LEFT JOIN drivers d ON s.assigned_driver_id = d.id
    WHERE s.tracking_number = ? OR s.id = ?
  `, [trackingNumber.toUpperCase().trim(), trackingNumber]);

  if (!shipment) {
    return res.status(404).json({
      success: false,
      error: `No se encontró ningún paquete con el número de guía ${trackingNumber}.`
    });
  }

  const events = queryAll(`
    SELECT * FROM shipment_events 
    WHERE shipment_id = ? 
    ORDER BY created_at ASC
  `, [shipment.id]);

  return res.json({
    success: true,
    shipment: {
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      serviceType: shipment.service_type,
      status: shipment.status,
      origin: JSON.parse(shipment.origin_json || '{}'),
      destination: JSON.parse(shipment.destination_json || '{}'),
      package: JSON.parse(shipment.package_json || '{}'),
      pricing: JSON.parse(shipment.pricing_json || '{}'),
      codAmount: shipment.cod_amount,
      codCurrency: shipment.cod_currency,
      branchName: shipment.branch_name,
      driver: shipment.driver_name ? { name: shipment.driver_name, phone: shipment.driver_phone } : null,
      createdAt: shipment.created_at,
      updatedAt: shipment.updated_at,
      events
    }
  });
});
