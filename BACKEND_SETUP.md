# Backend Implementation Guide

This document provides a complete implementation guide for the Node.js backend server that will power the Li-Fi Communication System.

## Directory Structure

```
server/
├── src/
│   ├── index.js              # Main Express server
│   ├── mqttClient.js         # MQTT broker connection
│   ├── socketHandler.js      # Socket.io real-time events
│   ├── firestore.js          # Firestore integration (optional)
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   └── validation.js     # Request validation
│   └── routes/
│       ├── messages.js       # Message endpoints
│       ├── settings.js       # Settings endpoints
│       └── status.js         # Status endpoints
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## Complete Implementation

### 1. package.json

```json
{
  "name": "lifi-backend",
  "version": "1.0.0",
  "description": "Backend server for Li-Fi Communication System",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "mqtt": "^5.3.0",
    "socket.io": "^4.6.1",
    "firebase-admin": "^12.0.0",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

### 2. .env.example

```env
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:8080

# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=lifi-server

# MQTT Topics
MQTT_TOPIC_SEND=lifi/send
MQTT_TOPIC_RECEIVE=lifi/receive
MQTT_TOPIC_STATUS=lifi/status

# Firebase/Firestore (Optional)
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json
FIRESTORE_COLLECTION=messages

# Security
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRY=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 3. src/index.js (Main Server)

```javascript
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initializeMQTT } from './mqttClient.js';
import { initializeSocketIO } from './socketHandler.js';
import messagesRouter from './routes/messages.js';
import settingsRouter from './routes/settings.js';
import statusRouter from './routes/status.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/messages', messagesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/status', statusRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize MQTT client
const mqttClient = initializeMQTT();

// Initialize Socket.IO
initializeSocketIO(httpServer, mqttClient);

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    mqttClient.end();
    process.exit(0);
  });
});

export { app, mqttClient };
```

### 4. src/mqttClient.js

```javascript
import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

let mqttClient = null;
let messageStore = []; // In-memory store (replace with Firestore in production)

export function initializeMQTT() {
  const options = {
    clientId: process.env.MQTT_CLIENT_ID || 'lifi-server',
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
  };

  const brokerUrl = `${process.env.MQTT_BROKER_URL}:${process.env.MQTT_BROKER_PORT}`;
  
  mqttClient = mqtt.connect(brokerUrl, options);

  mqttClient.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    
    // Subscribe to topics
    mqttClient.subscribe(process.env.MQTT_TOPIC_RECEIVE, (err) => {
      if (err) {
        console.error('Failed to subscribe to receive topic:', err);
      } else {
        console.log(`📥 Subscribed to ${process.env.MQTT_TOPIC_RECEIVE}`);
      }
    });

    mqttClient.subscribe(process.env.MQTT_TOPIC_STATUS, (err) => {
      if (err) {
        console.error('Failed to subscribe to status topic:', err);
      } else {
        console.log(`📊 Subscribed to ${process.env.MQTT_TOPIC_STATUS}`);
      }
    });
  });

  mqttClient.on('error', (error) => {
    console.error('MQTT Error:', error);
  });

  mqttClient.on('reconnect', () => {
    console.log('🔄 Reconnecting to MQTT broker...');
  });

  mqttClient.on('close', () => {
    console.log('❌ MQTT connection closed');
  });

  mqttClient.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 Received message on ${topic}:`, data);
      
      // Store message
      messageStore.push({
        topic,
        data,
        timestamp: new Date(),
      });
      
      // Keep only last 100 messages
      if (messageStore.length > 100) {
        messageStore = messageStore.slice(-100);
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  });

  return mqttClient;
}

export function publishMessage(topic, message) {
  if (!mqttClient || !mqttClient.connected) {
    throw new Error('MQTT client not connected');
  }

  return new Promise((resolve, reject) => {
    mqttClient.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function getMessageStore() {
  return messageStore;
}

export { mqttClient };
```

### 5. src/socketHandler.js

```javascript
import { Server } from 'socket.io';

let io = null;

export function initializeSocketIO(httpServer, mqttClient) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('subscribe-mqtt', (topic) => {
      console.log(`Client ${socket.id} subscribed to ${topic}`);
      socket.join(topic);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Forward MQTT messages to Socket.IO clients
  mqttClient.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      io.to(topic).emit('mqtt-message', { topic, data });
    } catch (error) {
      console.error('Error forwarding MQTT message to Socket.IO:', error);
    }
  });

  console.log('✅ Socket.IO initialized');
  return io;
}

export function broadcastMessage(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

export { io };
```

### 6. src/routes/messages.js

```javascript
import express from 'express';
import { publishMessage, getMessageStore } from '../mqttClient.js';
import { broadcastMessage } from '../socketHandler.js';

const router = express.Router();

// Get recent messages
router.get('/', (req, res) => {
  try {
    const messages = getMessageStore();
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message via MQTT
router.post('/send', async (req, res) => {
  try {
    const { message, deviceId } = req.body;

    if (!message || !deviceId) {
      return res.status(400).json({
        error: 'Missing required fields: message, deviceId'
      });
    }

    const payload = {
      message,
      deviceId,
      timestamp: new Date().toISOString()
    };

    await publishMessage(process.env.MQTT_TOPIC_SEND, payload);
    
    // Broadcast to connected clients
    broadcastMessage('message-sent', payload);

    res.json({ success: true, payload });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 7. src/routes/settings.js

```javascript
import express from 'express';

const router = express.Router();
let settings = {
  ssid: 'LiFi-Network',
  password: ''
};

// Get settings
router.get('/', (req, res) => {
  // Don't send password
  res.json({
    ssid: settings.ssid
  });
});

// Update settings
router.post('/', (req, res) => {
  try {
    const { ssid, password } = req.body;

    if (ssid) settings.ssid = ssid;
    if (password) settings.password = password;

    res.json({ success: true, ssid: settings.ssid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 8. src/routes/status.js

```javascript
import express from 'express';

const router = express.Router();

// Get system status
router.get('/', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    devices: [
      {
        id: 'esp32-001',
        name: 'ESP32 Transmitter',
        status: 'online',
        lastSeen: new Date().toISOString()
      },
      {
        id: 'esp32-002',
        name: 'ESP32 Receiver',
        status: 'online',
        lastSeen: new Date().toISOString()
      }
    ]
  });
});

export default router;
```

### 9. Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "src/index.js"]
```

### 10. docker-compose.yml

```yaml
version: '3.8'

services:
  mosquitto:
    image: eclipse-mosquitto:2
    container_name: lifi-mosquitto
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log
    restart: unless-stopped

  backend:
    build: .
    container_name: lifi-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MQTT_BROKER_URL=mqtt://mosquitto
      - MQTT_BROKER_PORT=1883
      - FRONTEND_URL=http://localhost:8080
    depends_on:
      - mosquitto
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  frontend:
    image: nginx:alpine
    container_name: lifi-frontend
    ports:
      - "8080:80"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
    restart: unless-stopped
```

### 11. mosquitto/config/mosquitto.conf

```conf
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
```

## Running the Backend

### Development Mode

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Production with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Testing the Backend

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Get messages
curl http://localhost:3000/api/messages

# Send a message
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from API","deviceId":"esp32-001"}'

# Get system status
curl http://localhost:3000/api/status

# Update settings
curl -X POST http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"ssid":"MyNetwork","password":"secret123"}'
```

### Testing MQTT

```bash
# Subscribe to receive topic
mosquitto_sub -h localhost -t lifi/receive -v

# Publish to send topic
mosquitto_pub -h localhost -t lifi/send \
  -m '{"message":"Test from MQTT","deviceId":"test-device"}'
```

### Testing Socket.io

Create a simple HTML file to test:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Socket.IO Test</title>
  <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
</head>
<body>
  <h1>Socket.IO Connection Test</h1>
  <div id="status">Connecting...</div>
  <div id="messages"></div>

  <script>
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      document.getElementById('status').textContent = 'Connected!';
      socket.emit('subscribe-mqtt', 'lifi/receive');
    });

    socket.on('mqtt-message', (data) => {
      const div = document.createElement('div');
      div.textContent = JSON.stringify(data);
      document.getElementById('messages').appendChild(div);
    });

    socket.on('disconnect', () => {
      document.getElementById('status').textContent = 'Disconnected';
    });
  </script>
</body>
</html>
```

## Security Recommendations

1. **Use environment variables** for all sensitive data
2. **Enable MQTT authentication** in production
3. **Use TLS/SSL** for MQTT (port 8883) and HTTPS for API
4. **Implement JWT authentication** for API endpoints
5. **Validate all inputs** with Joi or similar
6. **Use Helmet** for HTTP security headers
7. **Enable rate limiting** to prevent abuse
8. **Use CORS** to restrict origins
9. **Keep dependencies updated** with `npm audit`
10. **Use a reverse proxy** (Nginx) in production

## Monitoring & Logging

Add logging with Winston:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

## Next Steps

1. Implement Firestore integration for persistent storage
2. Add JWT authentication
3. Create comprehensive API tests
4. Set up CI/CD pipeline
5. Add monitoring (Prometheus, Grafana)
6. Implement WebSocket authentication
7. Add request validation middleware
8. Create API documentation (Swagger/OpenAPI)
