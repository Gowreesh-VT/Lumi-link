// Custom Next.js server — starts Next.js + Socket.io + SerialPort on one port.
// Run with: node server.js  (or npm run dev)

import 'dotenv/config';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || `http://${hostname}:${port}`;

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

function openSerialPort(path, label) {
  if (!path) {
    console.warn(`[serial] ${label} port not configured — set ${label}_PORT in .env`);
    return null;
  }

  const sp = new SerialPort({ path, baudRate: BAUD_RATE, autoOpen: false });

  sp.open((err) => {
    if (err) {
      console.error(`[serial] Failed to open ${label} (${path}):`, err.message);
    } else {
      console.log(`[serial] ${label} open: ${path} @ ${BAUD_RATE} baud`);
    }
  });

  sp.on('close', () => console.log(`[serial] ${label} closed`));
  sp.on('error', (err) => console.error(`[serial] ${label} error:`, err.message));

  return sp;
}

const txPort = openSerialPort(TX_PORT_PATH, 'TX');
const rxPort = openSerialPort(RX_PORT_PATH, 'RX');

// Forward every newline-delimited line from the RX ESP32 → all browser clients
if (rxPort) {
  const parser = rxPort.pipe(new ReadlineParser({ delimiter: '\n' }));
  parser.on('data', (line) => {
    const text = line.trim();
    if (!text) return;
    console.log(`[RX] ${text}`);
    io.emit('received_message', { message: text, timestamp: new Date().toISOString() });
  });
}

// ─── Socket.io events ────────────────────────────────────────────────────────

function getStatus() {
  return {
    lifiConnected: !!(txPort?.isOpen && rxPort?.isOpen),
    txConnected: !!txPort?.isOpen,
    rxConnected: !!rxPort?.isOpen,
    timestamp: new Date().toISOString(),
  };
}

// Track paused state so we can skip TX writes when paused
let transmissionActive = true;

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // Give the new client the current status immediately
  socket.emit('system_status', getStatus());

  // Browser wants to transmit a message via Li-Fi
  socket.on('send_message', ({ message }) => {
    if (!message || typeof message !== 'string') return;
    const safe = message.replace(/[\r\n]+/g, ' ').trim();
    if (!safe) return;

    if (!transmissionActive) {
      console.warn('[TX] Transmission paused — message not sent');
      socket.emit('transmit_ack', { success: false, error: 'Transmission is paused' });
      return;
    }

    console.log(`[TX] ${safe}`);

    if (txPort?.isOpen) {
      txPort.write(`${safe}\n`, (err) => {
        socket.emit('transmit_ack', err
          ? { success: false, error: err.message }
          : { success: true });
      });
    } else {
      console.warn('[TX] Port not open — message not sent to hardware');
      socket.emit('transmit_ack', { success: false, error: 'TX serial port not connected' });
    }
  });

  // Dashboard / transmitter page requests to start or stop transmission
  socket.on('start_transmission', () => {
    transmissionActive = true;
    console.log('[TX] Transmission started');
    io.emit('system_status', getStatus());
  });

  socket.on('stop_transmission', () => {
    transmissionActive = false;
    console.log('[TX] Transmission stopped');
    io.emit('system_status', getStatus());
  });

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

// Broadcast status updates every 5 s
setInterval(() => io.emit('system_status', getStatus()), 5000);

// ─── Start ──────────────────────────────────────────────────────────────────

httpServer.listen(port, () => {
  console.log(`\n> LumiLink running at http://${hostname}:${port}\n`);
  if (!TX_PORT_PATH || !RX_PORT_PATH) {
    console.warn('  Serial ports not configured.');
    console.warn('  Run `npm run list-ports` to find them, then add TX_PORT and RX_PORT to .env\n');
  }
});
