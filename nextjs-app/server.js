// Custom Next.js server — starts Next.js + Socket.io + SerialPort on one port.
// Run with: node server.js  (or npm run dev)

import 'dotenv/config';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import {
  addStoredMessage,
  updateStoredMessageStatus,
  updateHardwareStatus,
  getHardwareStatus,
} from './lib/serverState.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
// Allow connections from any device on the local network
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

const TX_PORT_PATH = process.env.TX_PORT;   // e.g. /dev/cu.usbserial-TX
const RX_PORT_PATH = process.env.RX_PORT;   // e.g. /dev/cu.usbserial-RX
const BAUD_RATE = parseInt(process.env.BAUD_RATE || '115200', 10);

// ─── Next.js ────────────────────────────────────────────────────────────────

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();
console.log(`> Next.js ready`);

// ─── HTTP server (shared with Socket.io) ────────────────────────────────────

const httpServer = createServer(async (req, res) => {
  const parsedUrl = parse(req.url, true);
  await handle(req, res, parsedUrl);
});

// ─── Socket.io ──────────────────────────────────────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// ─── Serial port helpers ─────────────────────────────────────────────────────

const RETRY_INTERVAL_MS = 3000;

function openSerialPort(path, label) {
  if (!path) {
    console.warn(`[serial] ${label} port not configured — set ${label}_PORT in .env`);
    return null;
  }

  const sp = new SerialPort({ path, baudRate: BAUD_RATE, autoOpen: false });

  function tryOpen() {
    if (sp.isOpen) return;
    sp.open((err) => {
      if (err) {
        console.error(`[serial] Failed to open ${label} (${path}): ${err.message} — retrying in ${RETRY_INTERVAL_MS / 1000}s`);
        setTimeout(tryOpen, RETRY_INTERVAL_MS);
      } else {
        console.log(`[serial] ${label} open: ${path} @ ${BAUD_RATE} baud`);
        syncHardwareStatus();
      }
    });
  }

  sp.on('close', () => {
    console.log(`[serial] ${label} closed — retrying in ${RETRY_INTERVAL_MS / 1000}s`);
    syncHardwareStatus();
    setTimeout(tryOpen, RETRY_INTERVAL_MS);
  });
  sp.on('error', (err) => console.error(`[serial] ${label} error:`, err.message));

  tryOpen();
  return sp;
}

const txPort = openSerialPort(TX_PORT_PATH, 'TX');
const rxPort = openSerialPort(RX_PORT_PATH, 'RX');

// Sync the shared singleton + broadcast to all clients
function syncHardwareStatus() {
  const patch = {
    txConnected: !!txPort?.isOpen,
    rxConnected: !!rxPort?.isOpen,
    lifiConnected: !!(txPort?.isOpen && rxPort?.isOpen),
  };
  updateHardwareStatus(patch);
  io.emit('system_status', getSocketStatus());
}

// Forward every newline-delimited line from the RX ESP32 → all browser clients
if (rxPort) {
  const parser = rxPort.pipe(new ReadlineParser({ delimiter: '\n' }));
  parser.on('data', (line) => {
    const text = line.trim();
    if (!text) return;
    console.log(`[RX] ${text}`);

    // Store in shared state so GET /api/messages returns real data
    addStoredMessage({ content: text, direction: 'received', status: 'success' });

    io.emit('received_message', { message: text, timestamp: new Date().toISOString() });
  });
}

// ─── Socket.io events ────────────────────────────────────────────────────────

function getSocketStatus() {
  const hw = getHardwareStatus();
  return {
    lifiConnected: hw.lifiConnected,
    txConnected: hw.txConnected,
    rxConnected: hw.rxConnected,
    timestamp: hw.updatedAt,
  };
}

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // Give the new client the current status immediately
  socket.emit('system_status', getSocketStatus());

  // Browser wants to transmit a message via Li-Fi
  socket.on('send_message', ({ message }) => {
    if (!message || typeof message !== 'string') return;
    const safe = message.replace(/[\r\n]+/g, ' ').trim();
    if (!safe) return;

    if (!getHardwareStatus().transmissionActive) {
      console.warn('[TX] Transmission paused — message not sent');
      socket.emit('transmit_ack', { success: false, error: 'Transmission is paused' });
      return;
    }

    console.log(`[TX] ${safe}`);

    // Record in shared state (pending → updated to success/error on ack)
    const stored = addStoredMessage({ content: safe, direction: 'sent', status: 'pending' });

    if (txPort?.isOpen) {
      txPort.write(`${safe}\n`, (err) => {
        const status = err ? 'error' : 'success';
        updateStoredMessageStatus(stored.id, status);
        socket.emit('transmit_ack', err
          ? { success: false, error: err.message, id: stored.id }
          : { success: true, id: stored.id });
      });
    } else {
      updateStoredMessageStatus(stored.id, 'error');
      console.warn('[TX] Port not open — message not sent to hardware');
      socket.emit('transmit_ack', { success: false, error: 'TX serial port not connected', id: stored.id });
    }
  });

  // Dashboard / transmitter page requests to start or stop transmission
  socket.on('start_transmission', () => {
    updateHardwareStatus({ transmissionActive: true });
    console.log('[TX] Transmission started');
    io.emit('system_status', getSocketStatus());
  });

  socket.on('stop_transmission', () => {
    updateHardwareStatus({ transmissionActive: false });
    console.log('[TX] Transmission stopped');
    io.emit('system_status', getSocketStatus());
  });

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

// Broadcast status updates every 5 s
setInterval(() => {
  syncHardwareStatus();
}, 5000);

// ─── Start ──────────────────────────────────────────────────────────────────

httpServer.listen(port, () => {
  console.log(`\n> LumiLink running at http://${hostname}:${port}`);
  console.log(`> API routes: /api/health  /api/status  /api/messages  /api/settings\n`);
  if (!TX_PORT_PATH || !RX_PORT_PATH) {
    console.warn('  Serial ports not configured.');
    console.warn('  Run `npm run list-ports` to find them, then add TX_PORT and RX_PORT to .env\n');
  }
});
