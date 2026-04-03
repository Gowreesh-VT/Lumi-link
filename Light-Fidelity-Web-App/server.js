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
import {
  metricsRegistry,
  lifiMessagesSent,
  lifiBytesSent,
  lifiMessagesReceived,
  lifiBytesReceived,
  lifiDecodedErrors,
  lifiHardwareConnected,
} from './lib/metrics.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

const TX_PORT_PATH = process.env.TX_PORT;   
const RX_PORT_PATH = process.env.RX_PORT;   
const BAUD_RATE = parseInt(process.env.BAUD_RATE || '115200', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();
console.log(`> Next.js ready`);

const httpServer = createServer(async (req, res) => {
  const parsedUrl = parse(req.url, true);
  
  // ── Native Prometheus Metrics Endpoint ──
  if (parsedUrl.pathname === '/metrics') {
    res.setHeader('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
    return;
  }
  
  await handle(req, res, parsedUrl);
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

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

function syncHardwareStatus() {
  const patch = {
    txConnected: !!txPort?.isOpen,
    rxConnected: !!rxPort?.isOpen,
    lifiConnected: !!(txPort?.isOpen && rxPort?.isOpen),
  };
  updateHardwareStatus(patch);
  lifiHardwareConnected.set(patch.lifiConnected ? 1 : 0);
  io.emit('system_status', getSocketStatus());
}

if (rxPort) {
  const parser = rxPort.pipe(new ReadlineParser({ delimiter: '\n' }));
  parser.on('data', (line) => {
    const text = line.trim();
    if (!text) return;
    console.log(`[RX] ${text}`);

    // Telemetry instrumentation
    lifiBytesReceived.inc(Buffer.byteLength(line, 'utf8'));
    if (/\[([0-9A-Fa-f]{1,2})\]/.test(text)) {
      lifiDecodedErrors.inc();
    } else {
      lifiMessagesReceived.inc();
    }

    addStoredMessage({ content: text, direction: 'received', status: 'success' });

    io.emit('received_message', { message: text, timestamp: new Date().toISOString() });
  });
}

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

  socket.emit('system_status', getSocketStatus());

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

    const stored = addStoredMessage({ content: safe, direction: 'sent', status: 'pending' });

    if (txPort?.isOpen && !txPort.destroyed) {
      try {
        const payload = `${safe}\n`;
        txPort.write(payload, (err) => {
          const status = err ? 'error' : 'success';
          updateStoredMessageStatus(stored.id, status);
          if (!err) {
            lifiMessagesSent.inc();
            lifiBytesSent.inc(Buffer.byteLength(payload, 'utf8'));
          }
          socket.emit('transmit_ack', err
            ? { success: false, error: err.message, id: stored.id }
            : { success: true, id: stored.id });
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[TX] Write error:', msg);
        updateStoredMessageStatus(stored.id, 'error');
        syncHardwareStatus();
        socket.emit('transmit_ack', { success: false, error: msg, id: stored.id });
      }
    } else {
      updateStoredMessageStatus(stored.id, 'error');
      console.warn('[TX] Port not open — message not sent to hardware');
      socket.emit('transmit_ack', { success: false, error: 'TX serial port not connected', id: stored.id });
    }

  });

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

setInterval(() => {
  syncHardwareStatus();
}, 5000);

httpServer.listen(port, () => {
  console.log(`\n> LumiLink running at http://${hostname}:${port}`);
  console.log(`> API routes: /api/health  /api/status  /api/messages  /api/settings\n`);
  if (!TX_PORT_PATH || !RX_PORT_PATH) {
    console.warn('  Serial ports not configured.');
    console.warn('  Run `npm run list-ports` to find them, then add TX_PORT and RX_PORT to .env\n');
  }
});
