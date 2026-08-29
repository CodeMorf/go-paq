import http from 'http';
import url from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { app } from './core/app';
import { runSeeds } from './db/seed';
import { verifyToken, TokenPayload } from './auth/jwt';
import { execute, queryOne } from './db/database';

const PORT = process.env.PORT || 4000;

// 1. Run database migrations & seeds
try {
  runSeeds();
} catch (err) {
  console.error('Error running seeds:', err);
}

// 2. Create HTTP & Secure WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

interface AuthenticatedSocket extends WebSocket {
  user?: TokenPayload;
  organizationId?: string;
  isAlive?: boolean;
}

server.on('upgrade', (request, socket, head) => {
  const parsedUrl = url.parse(request.url || '', true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/ws') {
    const token = parsedUrl.query.token as string | undefined;

    // Verify token during WebSocket handshake if provided
    let user: TokenPayload | null = null;
    if (token) {
      user = verifyToken(token);
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      const authWs = ws as AuthenticatedSocket;
      if (user) {
        authWs.user = user;
        authWs.organizationId = user.organizationId;
      }
      wss.emit('connection', authWs, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws: AuthenticatedSocket) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());

      // 1. In-band Auth message
      if (data.type === 'auth' && data.token) {
        const decoded = verifyToken(data.token);
        if (decoded) {
          ws.user = decoded;
          ws.organizationId = decoded.organizationId;
          ws.send(JSON.stringify({ type: 'auth_success', user: { name: decoded.name, role: decoded.role } }));
        } else {
          ws.send(JSON.stringify({ type: 'auth_error', error: 'Token inválido' }));
        }
        return;
      }

      // 2. Require Authentication for all actions
      if (!ws.organizationId) {
        ws.send(JSON.stringify({ type: 'auth_required', error: 'Autenticación requerida para enviar mensajes.' }));
        return;
      }

      // 3. Driver Telemetry (Scoped to driver and tenant)
      if (data.type === 'driver_telemetry' && data.payload) {
        const { driverId, lat, lng, speed = 0, heading = 0, battery = 100 } = data.payload;

        // Verify driver belongs to current organization
        const driver = queryOne(`SELECT id, user_id FROM drivers WHERE id = ? AND organization_id = ?`, [driverId, ws.organizationId]);
        if (!driver) {
          ws.send(JSON.stringify({ type: 'error', error: 'Driver no autorizado en esta organización.' }));
          return;
        }

        // If authenticated user is a DRIVER, verify identity
        if (ws.user?.role === 'DRIVER' && driver.user_id && driver.user_id !== ws.user.userId) {
          ws.send(JSON.stringify({ type: 'error', error: 'No autorizado para enviar telemetría de otro conductor.' }));
          return;
        }

        execute(`
          UPDATE drivers 
          SET current_lat = ?, current_lng = ?, speed = ?, heading = ?, battery = ?, status = ?, updated_at = datetime('now')
          WHERE id = ? AND organization_id = ?
        `, [lat, lng, speed, heading, battery, speed > 5 ? 'in_motion' : 'idle', driverId, ws.organizationId]);

        // Broadcast ONLY to authenticated clients in the SAME organization room
        const broadcastMsg = JSON.stringify({
          type: 'driver.location.updated',
          payload: {
            driverId,
            position: { lat, lng },
            telemetry: { speedKmh: speed, headingDeg: heading, batteryPct: battery, timestamp: new Date().toISOString() }
          }
        });

        wss.clients.forEach((client) => {
          const authClient = client as AuthenticatedSocket;
          if (authClient.readyState === WebSocket.OPEN && authClient.organizationId === ws.organizationId) {
            authClient.send(broadcastMsg);
          }
        });
      }
    } catch (e: any) {
      console.error('[WebSocket Error]:', e);
    }
  });

  ws.send(JSON.stringify({ type: 'connected', message: 'GoPaq Secure Realtime Bus Connected' }));
});

server.listen(PORT, () => {
  console.log(`🚀 GoPaq Core Logistics Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Secure WebSocket Realtime Server running on ws://localhost:${PORT}/ws`);
});
