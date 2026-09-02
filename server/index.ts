import http from 'http';
import url from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';
import { app } from './core/app';
import { initDatabaseAsync, queryOneAsync, executeAsync } from './db/database';
import { verifyToken, TokenPayload } from './auth/jwt';
import { normalizeRole } from './auth/roles';

const PORT = Number(process.env.PORT || 4000);

interface AuthenticatedSocket extends WebSocket {
  user: TokenPayload;
  organizationId: string;
  isAlive?: boolean;
}

const telemetrySchema = z.object({ driverId: z.string().min(1).max(120), lat: z.number().finite().min(-90).max(90), lng: z.number().finite().min(-180).max(180), speed: z.number().finite().min(0).max(300).default(0), heading: z.number().finite().min(0).max(360).default(0), battery: z.number().finite().min(0).max(100).default(100) });

async function start() {
  await initDatabaseAsync();
  if (process.env.NODE_ENV !== 'production' && process.env.SEED_DEV_DATA === 'true') {
    const { runSeeds } = await import('./db/seed');
    runSeeds();
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

  server.on('upgrade', (request, socket, head) => {
    const parsedUrl = url.parse(request.url || '', true);
    if (parsedUrl.pathname !== '/ws') return socket.destroy();
    const origin = request.headers.origin;
    const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((item) => item.trim()).filter(Boolean);
    if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) return socket.destroy();

    // The access token is accepted only for the handshake. It is never logged
    // and connections without a valid token are rejected before upgrade.
    // Query-string tokens are accepted only in non-production development. In
    // production a URL token can leak through browser history, proxies, or logs;
    // clients must use Sec-WebSocket-Protocol instead.
    const queryToken = process.env.NODE_ENV === 'production' ? undefined : (typeof parsedUrl.query.token === 'string' ? parsedUrl.query.token : undefined);
    const protocolToken = String(request.headers['sec-websocket-protocol'] || '').split(',').map((item) => item.trim()).find((item) => item.startsWith('gopaq-bearer.'))?.slice('gopaq-bearer.'.length);
    const user = verifyToken(protocolToken || queryToken || '');
    if (!user) return socket.destroy();
    wss.handleUpgrade(request, socket, head, (ws) => {
      const authWs = ws as AuthenticatedSocket;
      authWs.user = user;
      authWs.organizationId = user.organizationId;
      wss.emit('connection', authWs, request);
    });
  });

  wss.on('connection', (ws: AuthenticatedSocket) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    ws.send(JSON.stringify({ type: 'connected', message: 'GoPaq Secure Realtime Bus Connected' }));
    ws.on('message', async (message: string) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type !== 'driver_telemetry' || !parsed.payload) return;
        const telemetry = telemetrySchema.safeParse(parsed.payload);
        if (!telemetry.success) return ws.send(JSON.stringify({ type: 'error', error: 'Telemetría inválida.' }));
        const data = telemetry.data;
        const driver = await queryOneAsync<{ id: string; user_id: string | null }>('SELECT id, user_id FROM drivers WHERE id = ? AND organization_id = ? AND active = 1', [data.driverId, ws.organizationId]);
        if (!driver) return ws.send(JSON.stringify({ type: 'error', error: 'Driver no autorizado en esta organización.' }));
        if (['DRIVER', 'COURIER'].includes(normalizeRole(ws.user.role)) && driver.user_id !== ws.user.userId) return ws.send(JSON.stringify({ type: 'error', error: 'No autorizado para enviar telemetría de otro conductor.' }));
        const locationSql = process.env.DATABASE_URL?.startsWith('postgres') ? ', current_location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography' : '';
        const params: any[] = [data.lat, data.lng, data.speed, data.heading, data.battery, data.speed > 5 ? 'in_motion' : 'idle'];
        if (locationSql) params.push(data.lng, data.lat);
        params.push(data.driverId, ws.organizationId);
        await executeAsync(`UPDATE drivers SET current_lat = ?, current_lng = ?, speed = ?, heading = ?, battery = ?, status = ?${locationSql}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ? AND active = 1`, params);
        const broadcastMsg = JSON.stringify({ type: 'driver.location.updated', payload: { driverId: data.driverId, position: { lat: data.lat, lng: data.lng }, telemetry: { speedKmh: data.speed, headingDeg: data.heading, batteryPct: data.battery, timestamp: new Date().toISOString() } } });
        wss.clients.forEach((client) => { const target = client as AuthenticatedSocket; if (target.readyState === WebSocket.OPEN && target.organizationId === ws.organizationId) target.send(broadcastMsg); });
      } catch (error) {
        console.error('[WebSocket Error]:', error instanceof Error ? error.message : 'invalid_message');
        ws.send(JSON.stringify({ type: 'error', error: 'Mensaje realtime inválido.' }));
      }
    });
  });

  let realtimeSubscriber: import('ioredis').default | null = null;
  if (process.env.REDIS_URL) {
    const Redis = (await import('ioredis')).default;
    realtimeSubscriber = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, enableOfflineQueue: false, connectTimeout: 5000 });
    await realtimeSubscriber.subscribe('gopaq:realtime');
    realtimeSubscriber.on('message', (channel, message) => {
      if (channel !== 'gopaq:realtime') return;
      try {
        const event = JSON.parse(message);
        const payload = JSON.stringify({ type: event.eventType, eventId: event.eventId, payload: event.payload });
        wss.clients.forEach((client) => {
          const target = client as AuthenticatedSocket;
          if (target.readyState === WebSocket.OPEN && target.organizationId === event.organizationId) target.send(payload);
        });
      } catch (error) {
        console.error('[GoPaq Realtime] invalid event', error instanceof Error ? error.message : 'invalid_event');
      }
    });
  }

  const heartbeat = setInterval(() => { wss.clients.forEach((client) => { const ws = client as AuthenticatedSocket; if (ws.isAlive === false) return ws.terminate(); ws.isAlive = false; ws.ping(); }); }, 30000);
  wss.on('close', () => clearInterval(heartbeat));
  server.on('close', () => { if (realtimeSubscriber) void realtimeSubscriber.quit(); });
  server.listen(PORT, () => { console.log(`GoPaq API listening on port ${PORT}`); });
}

start().catch((error) => { console.error('GoPaq startup failed:', error instanceof Error ? error.message : 'unknown_error'); process.exit(1); });
