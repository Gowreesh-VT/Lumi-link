# Hybrid Li-Fi + Wi-Fi Communication System

[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A comprehensive web-based dashboard for monitoring and controlling a hybrid Li-Fi and Wi-Fi communication system. This project combines Light Fidelity (Li-Fi) technology with traditional Wi-Fi to create a robust, high-speed wireless communication network.

**Team Members:**
- Gowreesh V.T. (vt.gowreesh43@gmail.com)
- Anvesha
- Shruthishree
- Sidharth

**Project Type:** Academic Engineering Final Year Project

---

## 🎯 Project Overview

This system demonstrates the practical implementation of visible light communication (VLC) technology combined with Wi-Fi networking. It provides:

- **Real-time monitoring** of Li-Fi and Wi-Fi connections
- **Bi-directional communication** between transmitter and receiver
- **Data visualization** with charts and analytics
- **Network configuration** and device management
- **Mock MQTT integration** ready for ESP32 deployment

---

## 📁 Repository Structure

```
.
├── frontend/                     # React + Vite frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # ShadCN UI components
│   │   │   ├── AppSidebar.tsx   # Navigation sidebar
│   │   │   ├── Header.tsx       # Top header with clock
│   │   │   ├── StatusBadge.tsx  # Status indicator
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── LoadingScreen.tsx
│   │   ├── pages/               # Main application pages
│   │   │   ├── Dashboard.tsx    # System overview
│   │   │   ├── Transmitter.tsx  # Message transmission
│   │   │   ├── Receiver.tsx     # Data reception
│   │   │   ├── Settings.tsx     # Network config
│   │   │   ├── Analytics.tsx    # Data visualization
│   │   │   └── About.tsx        # Project info
│   │   ├── store/               # State management (Zustand)
│   │   │   └── useStore.ts
│   │   ├── lib/                 # Utilities
│   │   │   ├── mockData.ts      # Mock data generators
│   │   │   └── utils.ts
│   │   ├── App.tsx              # Main app component
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── server/                       # Node.js + Express backend (to be added)
│   ├── src/
│   │   ├── index.js             # Express server
│   │   ├── mqttClient.js        # MQTT bridge
│   │   ├── socketHandler.js     # Socket.io handler
│   │   └── routes/              # API routes
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
│
└── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- Git (optional, for cloning)

### Frontend Setup

1. **Clone the repository** (if using Git):
   ```bash
   git clone <YOUR_GIT_URL>
   cd lifi-communication-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:8080`

4. **Build for production**:
   ```bash
   npm run build
   ```
   
   Production files will be in the `dist/` folder.

5. **Preview production build**:
   ```bash
   npm run preview
   ```

---

## 🎨 Features

### ✅ Implemented Features

- **Dashboard**
  - Real-time system status cards
  - Live signal strength monitoring
  - Start/Stop transmission controls
  - System health metrics

- **Transmitter Control**
  - Message input and transmission
  - LED on/off control
  - Transmission progress visualization
  - Message log with timestamps

- **Receiver Monitor**
  - Live incoming message feed
  - Signal intensity graphs
  - Error detection log
  - CSV data export

- **Network Settings**
  - Wi-Fi configuration form
  - Connected devices list
  - Connection testing
  - Network information display

- **Analytics Dashboard**
  - Multiple time range filters (hour/day/week)
  - Throughput, packet loss, and light intensity charts
  - CSV and PDF export (mock)
  - Statistical summaries

- **About Page**
  - Project description
  - Team information
  - Contact form

### 🎨 UI/UX Features

- Dark/Light mode toggle (persisted)
- Real-time clock in header
- Responsive sidebar navigation
- Smooth page transitions (Framer Motion)
- Glassmorphism card design
- Interactive charts (Recharts)
- Toast notifications
- Loading screen

---

## 🏗️ Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React App (Vite)                  │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Zustand   │  │ React Router │  │  Recharts │ │
│  │   (State)   │  │ (Navigation) │  │  (Charts) │ │
│  └─────────────┘  └──────────────┘  └───────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │          Pages & Components                   │ │
│  │  • Dashboard  • Transmitter  • Receiver       │ │
│  │  • Settings   • Analytics    • About          │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │          UI Component Library                 │ │
│  │  ShadCN UI + Tailwind CSS                     │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                        ▼
                  (Future: Backend API)
                        ▼
        ┌───────────────────────────────────┐
        │     Node.js + Express Server      │
        │  ┌──────────┐    ┌──────────────┐ │
        │  │   MQTT   │◄──►│  Socket.io   │ │
        │  │  Bridge  │    │  (Real-time) │ │
        │  └──────────┘    └──────────────┘ │
        │         ▲              ▲           │
        └─────────┼──────────────┼───────────┘
                  │              │
         ┌────────▼──────┐       └──────► Frontend
         │   Mosquitto   │
         │ MQTT Broker   │
         └───────────────┘
                  ▲
         ┌────────┼────────┐
         │                 │
    ┌────▼─────┐     ┌────▼─────┐
    │  ESP32   │     │  ESP32   │
    │Transmitter│     │ Receiver │
    └──────────┘     └──────────┘
```

### Data Flow

1. **Frontend** → Mock data generation (currently)
2. **Future:** Frontend → REST API → Backend
3. **Future:** Backend → MQTT Broker → ESP32 devices
4. **Future:** ESP32 → MQTT → Backend → Socket.io → Frontend (real-time updates)

---

## 🔌 Backend Setup (Future Implementation)

### Prerequisites

- Node.js >= 18.x
- Mosquitto MQTT Broker (optional, for local testing)
- Firebase/Firestore account (optional, for persistence)

### Backend Structure (To Be Implemented)

```javascript
// server/src/index.js
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mqttClient from './mqttClient.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL }
});

app.use(cors());
app.use(express.json());

// REST API Endpoints
app.post('/api/send', async (req, res) => {
  const { message, deviceId } = req.body;
  // Publish to MQTT topic 'lifi/send'
  mqttClient.publish('lifi/send', JSON.stringify({ message, deviceId }));
  res.json({ success: true });
});

app.get('/api/messages', async (req, res) => {
  // Return recent messages from in-memory store or Firestore
  res.json({ messages: [] });
});

app.post('/api/settings', async (req, res) => {
  // Save network settings
  res.json({ success: true });
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', devices: [] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io real-time events
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// MQTT message handler
mqttClient.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());
  // Broadcast to all connected clients
  io.emit('mqtt-message', { topic, data });
});

httpServer.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:8080

# MQTT Broker
MQTT_BROKER_URL=mqtt://localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Firebase/Firestore (Optional)
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT=./path/to/serviceAccount.json

# Security
JWT_SECRET=your_jwt_secret_here
```

### Running Mosquitto Locally (Optional)

Using Docker:
```bash
docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto
```

Or install locally:
```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# macOS
brew install mosquitto

# Windows
# Download from https://mosquitto.org/download/
```

---

## 🤖 ESP32 Integration

### MQTT Topics

| Topic | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `lifi/send` | Backend → ESP32 | `{ "message": "Hello", "deviceId": "esp32-001" }` | Send data to transmitter |
| `lifi/receive` | ESP32 → Backend | `{ "message": "Hello", "deviceId": "esp32-002", "rssi": -45 }` | Received data from receiver |
| `lifi/status` | ESP32 → Backend | `{ "deviceId": "esp32-001", "status": "online", "uptime": 3600 }` | Device status updates |

### ESP32 Sample Code (Arduino)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// Wi-Fi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker
const char* mqtt_server = "YOUR_SERVER_IP";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

// LED pin for Li-Fi
const int LED_PIN = 2;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected");
  
  // Connect to MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  if (String(topic) == "lifi/send") {
    // Transmit message via LED modulation
    transmitMessage(message);
  }
}

void transmitMessage(String message) {
  // Simple on-off keying (OOK) modulation
  for (char c : message) {
    for (int bit = 0; bit < 8; bit++) {
      digitalWrite(LED_PIN, (c >> bit) & 1);
      delayMicroseconds(100); // 10 kbps
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32-Transmitter")) {
      client.subscribe("lifi/send");
    } else {
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
```

### REST API Integration

ESP32 can also communicate via HTTP:

```cpp
#include <HTTPClient.h>

void sendMessage(String message) {
  HTTPClient http;
  http.begin("http://YOUR_SERVER_IP:3000/api/send");
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"message\":\"" + message + "\",\"deviceId\":\"esp32-001\"}";
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    Serial.println("Message sent successfully");
  }
  http.end();
}
```

---

## 📊 Technology Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **ShadCN UI** - Component library
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Zustand** - State management
- **React Router** - Navigation
- **Lucide React** - Icons

### Backend (Future)
- **Node.js** - Runtime
- **Express** - Web framework
- **MQTT.js** - MQTT client
- **Socket.io** - Real-time communication
- **Firebase Admin SDK** - Firestore integration

### Hardware
- **ESP32** - Microcontroller
- **High-brightness LED** - Li-Fi transmitter
- **Photodiode/Phototransistor** - Li-Fi receiver

---

## 🧪 Testing

### Manual Testing
```bash
# Test MQTT publish (requires mosquitto-clients)
mosquitto_pub -h localhost -t lifi/send -m '{"message":"Test","deviceId":"test"}'

# Test MQTT subscribe
mosquitto_sub -h localhost -t lifi/receive

# Test REST API (requires backend running)
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","deviceId":"esp32-001"}'

# Health check
curl http://localhost:3000/health
```

### Unit Tests (Future)
```bash
npm run test
```

---

## 🚢 Deployment

### Frontend Deployment

**Vercel:**
```bash
npm install -g vercel
vercel deploy
```

**Netlify:**
```bash
npm run build
# Drag and drop the dist/ folder to Netlify
```

### Backend Deployment

**Docker:**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

```bash
docker build -t lifi-backend .
docker run -p 3000:3000 --env-file .env lifi-backend
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  mosquitto:
    image: eclipse-mosquitto
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf

  backend:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      - MQTT_BROKER_URL=mqtt://mosquitto
    depends_on:
      - mosquitto
```

---

## 📚 API Documentation

### REST Endpoints

#### POST /api/send
Send a message via Li-Fi
```json
{
  "message": "Hello World",
  "deviceId": "esp32-001"
}
```
**Response:** `{ "success": true }`

#### GET /api/messages
Get recent messages
**Response:**
```json
{
  "messages": [
    {
      "id": "msg-001",
      "content": "Hello",
      "timestamp": "2024-01-15T10:30:00Z",
      "direction": "received"
    }
  ]
}
```

#### POST /api/settings
Save network settings
```json
{
  "ssid": "LiFi-Network",
  "password": "secret123"
}
```

#### GET /api/status
Get system status
**Response:**
```json
{
  "status": "online",
  "devices": [
    {
      "id": "esp32-001",
      "status": "online",
      "lastSeen": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 🔒 Security Considerations

⚠️ **Important:** This is an educational project. For production use:

1. **Use HTTPS/TLS** for all web traffic
2. **Enable MQTT over TLS** (port 8883)
3. **Implement authentication** for MQTT and REST API
4. **Use JWT tokens** for session management
5. **Validate all inputs** on both client and server
6. **Set up CORS properly** to restrict origins
7. **Use environment variables** for all secrets
8. **Enable rate limiting** on API endpoints
9. **Implement proper error handling** without exposing internals
10. **Keep dependencies updated** (run `npm audit fix`)

---

## 🐛 Troubleshooting

### Frontend Issues

**Issue:** Blank page after build
- **Solution:** Check browser console for errors. Ensure all imports are correct.

**Issue:** Styles not loading
- **Solution:** Run `npm run dev` again. Clear browser cache.

### Backend Issues (Future)

**Issue:** MQTT connection refused
- **Solution:** Check Mosquitto is running (`mosquitto -v`). Verify broker URL/port.

**Issue:** CORS errors
- **Solution:** Add frontend URL to CORS whitelist in Express config.

### ESP32 Issues

**Issue:** ESP32 won't connect to Wi-Fi
- **Solution:** Double-check SSID/password. Ensure 2.4GHz network (ESP32 doesn't support 5GHz).

**Issue:** MQTT messages not received
- **Solution:** Verify MQTT broker IP. Check firewall rules. Use `mosquitto_sub` to debug.

---

## 📖 Further Development

### Planned Features
- [ ] Backend API implementation
- [ ] Real MQTT integration
- [ ] Firestore data persistence
- [ ] User authentication
- [ ] ESP32 firmware OTA updates
- [ ] Advanced error correction (Reed-Solomon)
- [ ] Frequency modulation for higher data rates
- [ ] Mobile app (React Native)

---

## 👥 Contributing

This is an academic project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- ShadCN UI for the beautiful component library
- Recharts for data visualization
- Eclipse Mosquitto for MQTT broker
- ESP32 community for hardware support

---

## 📧 Contact

**Team Members:**
- **Gowreesh V.T.** - vt.gowreesh43@gmail.com
- **Anvesha**
- **Shruthishree**
- **Sidharth**

Project: Final Year Engineering Project  

For questions, issues, or collaboration opportunities, please open an issue on GitHub or contact via email.

---

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Transmitter Control
![Transmitter](docs/screenshots/transmitter.png)

### Analytics
![Analytics](docs/screenshots/analytics.png)

---

**Built with ❤️ for academic excellence and real-world impact**
