import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { app } from './core/app';
import { runSeeds } from './db/seed';
import { WitylogixAdapter } from './integrations/witylogix/witylogix.adapter';
import { execute } from './db/database';

const PORT = process.env.PORT || 4000;

// 1. Run database migrations & seeds
try {
  runSeeds();
} catch (err) {
  console.error('Error running seeds:', err);
}

// 2. Create HTTP & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] Client connected to GoPaq Realtime Fleet Bus');

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'driver_telemetry' && data.payload) {
        const { driverId, lat, lng, speed = 0, heading = 0, battery = 100 } = data.payload;
        const processed = WitylogixAdapter.processGpsTelemetry(driverId, { lat, lng, speed, heading, battery });

        execute(`
          UPDATE drivers 
          SET current_lat = ?, current_lng = ?, speed = ?, heading = ?, battery = ?, status = ?, updated_at = datetime('now')
          WHERE id = ?
        `, [lat, lng, speed, heading, battery, processed.status, driverId]);

        // Broadcast to all active clients (Super Admin map, Sucursal live dispatch)
        const broadcastMsg = JSON.stringify({
          type: 'driver.location.updated',
          payload: processed
        });

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastMsg);
          }
        });
      }
    } catch (e) {
      console.error('[WebSocket Error processing message]:', e);
    }
  });

  ws.send(JSON.stringify({ type: 'connected', message: 'GoPaq Realtime Fleet Stream Connected (2026)' }));
});

server.listen(PORT, () => {
  console.log(`🚀 GoPaq Core Logistics Backend API running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket Realtime Server running on ws://localhost:${PORT}/ws`);
  console.log(`📑 OpenAPI Specification available at http://localhost:${PORT}/api/v1/docs/openapi.json`);
});
