# ESP32 Integration Guide

Complete guide for integrating ESP32 microcontrollers with the Li-Fi Communication System.

## Hardware Requirements

### Transmitter Module
- ESP32 Development Board
- High-brightness LED (white, > 1W recommended)
- LED driver circuit (current limiting resistor or constant current driver)
- Power supply (5V/3.3V)

### Receiver Module
- ESP32 Development Board
- Photodiode (e.g., BPW34) or phototransistor (e.g., TEPT5700)
- Amplifier circuit (op-amp like LM358)
- Power supply (5V/3.3V)

### Optional Components
- Fresnel lens (to focus light on receiver)
- Schmitt trigger for signal conditioning
- Level shifters if needed

## Circuit Diagrams

### Transmitter Circuit

```
ESP32 GPIO2 ────┬──────[Resistor 220Ω]─────┬──── LED Anode
                │                           │
                └── (Optional: MOSFET) ─────┘
                                            │
                                           GND
```

### Receiver Circuit

```
                          +3.3V
                            │
                       [10kΩ]
                            │
Photodiode ──────┬─────────┴────── ESP32 ADC (GPIO34)
                 │
                GND

With Op-Amp (recommended for better range):

Photodiode ───[─────]───── +
                           │ LM358
                        ───┴───── Output ───── ESP32 ADC
                        │
                       ─┴─ (Reference voltage)
```

## Complete ESP32 Code

### 1. platformio.ini (PlatformIO Configuration)

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
lib_deps = 
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^6.21.0
```

### 2. Transmitter Code (Complete)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ===== Configuration =====
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_SERVER = "YOUR_SERVER_IP";
const int MQTT_PORT = 1883;
const char* DEVICE_ID = "esp32-transmitter-001";

// LED Configuration
const int LED_PIN = 2;  // GPIO2 (built-in LED)
const int MODULATION_RATE = 1000;  // Bits per second

// ===== Global Objects =====
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ===== Function Declarations =====
void setupWiFi();
void setupMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void reconnectMQTT();
void transmitByte(byte data);
void transmitMessage(const char* message);
void publishStatus();

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  Serial.println("\n=== Li-Fi Transmitter Starting ===");
  
  setupWiFi();
  setupMQTT();
  
  Serial.println("=== Ready ===");
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
  
  // Publish status every 30 seconds
  static unsigned long lastStatusTime = 0;
  if (millis() - lastStatusTime > 30000) {
    publishStatus();
    lastStatusTime = millis();
  }
}

// ===== Wi-Fi Setup =====
void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

// ===== MQTT Setup =====
void setupMQTT() {
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512);  // Increase buffer for larger messages
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT broker...");
    
    String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" connected!");
      
      // Subscribe to topics
      mqttClient.subscribe("lifi/send");
      mqttClient.subscribe("lifi/control");
      
      Serial.println("Subscribed to topics");
      publishStatus();
    } else {
      Serial.print(" failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" - retrying in 5 seconds");
      delay(5000);
    }
  }
}

// ===== MQTT Callback =====
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  
  // Parse JSON payload
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  
  if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  if (strcmp(topic, "lifi/send") == 0) {
    const char* message = doc["message"];
    const char* deviceId = doc["deviceId"];
    
    Serial.print("Transmitting message: ");
    Serial.println(message);
    
    transmitMessage(message);
    
    // Acknowledge
    StaticJsonDocument<128> ackDoc;
    ackDoc["deviceId"] = DEVICE_ID;
    ackDoc["status"] = "transmitted";
    ackDoc["messageLength"] = strlen(message);
    
    char buffer[128];
    serializeJson(ackDoc, buffer);
    mqttClient.publish("lifi/ack", buffer);
  } 
  else if (strcmp(topic, "lifi/control") == 0) {
    const char* command = doc["command"];
    
    if (strcmp(command, "led_on") == 0) {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("LED turned ON");
    } else if (strcmp(command, "led_off") == 0) {
      digitalWrite(LED_PIN, LOW);
      Serial.println("LED turned OFF");
    }
  }
}

// ===== Li-Fi Transmission =====
void transmitByte(byte data) {
  int bitDelay = 1000000 / MODULATION_RATE;  // Microseconds per bit
  
  // Start bit (always 0)
  digitalWrite(LED_PIN, LOW);
  delayMicroseconds(bitDelay);
  
  // Data bits (LSB first)
  for (int i = 0; i < 8; i++) {
    digitalWrite(LED_PIN, (data >> i) & 1);
    delayMicroseconds(bitDelay);
  }
  
  // Stop bit (always 1)
  digitalWrite(LED_PIN, HIGH);
  delayMicroseconds(bitDelay);
}

void transmitMessage(const char* message) {
  unsigned long startTime = millis();
  
  // Preamble (alternating pattern for sync)
  for (int i = 0; i < 10; i++) {
    transmitByte(0xAA);  // 10101010
  }
  
  // Message length
  size_t len = strlen(message);
  transmitByte(len & 0xFF);
  
  // Message data
  for (size_t i = 0; i < len; i++) {
    transmitByte(message[i]);
  }
  
  // Checksum (simple XOR)
  byte checksum = 0;
  for (size_t i = 0; i < len; i++) {
    checksum ^= message[i];
  }
  transmitByte(checksum);
  
  // End transmission
  digitalWrite(LED_PIN, LOW);
  
  unsigned long duration = millis() - startTime;
  Serial.print("Transmission complete in ");
  Serial.print(duration);
  Serial.println(" ms");
}

// ===== Status Publishing =====
void publishStatus() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["type"] = "transmitter";
  doc["status"] = "online";
  doc["uptime"] = millis() / 1000;
  doc["wifiRSSI"] = WiFi.RSSI();
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["ledStatus"] = digitalRead(LED_PIN);
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  mqttClient.publish("lifi/status", buffer);
  
  Serial.println("Status published");
}
```

### 3. Receiver Code (Complete)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ===== Configuration =====
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_SERVER = "YOUR_SERVER_IP";
const int MQTT_PORT = 1883;
const char* DEVICE_ID = "esp32-receiver-001";

// Receiver Configuration
const int PHOTODIODE_PIN = 34;  // ADC1 channel
const int THRESHOLD = 2000;      // ADC threshold (0-4095)
const int SAMPLE_RATE = 1000;    // Samples per second

// ===== Global Objects =====
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Reception buffer
char rxBuffer[256];
int rxBufferIndex = 0;

// ===== Function Declarations =====
void setupWiFi();
void setupMQTT();
void reconnectMQTT();
byte receiveByte();
bool receiveMessage();
void publishReceivedMessage(const char* message);
void publishStatus();

void setup() {
  Serial.begin(115200);
  pinMode(PHOTODIODE_PIN, INPUT);
  
  Serial.println("\n=== Li-Fi Receiver Starting ===");
  
  setupWiFi();
  setupMQTT();
  
  Serial.println("=== Ready ===");
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
  
  // Try to receive messages
  if (receiveMessage()) {
    Serial.print("Message received: ");
    Serial.println(rxBuffer);
    publishReceivedMessage(rxBuffer);
  }
  
  // Publish status every 30 seconds
  static unsigned long lastStatusTime = 0;
  if (millis() - lastStatusTime > 30000) {
    publishStatus();
    lastStatusTime = millis();
  }
}

// ===== Wi-Fi Setup =====
void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  }
}

// ===== MQTT Setup =====
void setupMQTT() {
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setBufferSize(512);
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT broker...");
    
    String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" connected!");
      publishStatus();
    } else {
      Serial.print(" failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" - retrying in 5 seconds");
      delay(5000);
    }
  }
}

// ===== Li-Fi Reception =====
byte receiveByte() {
  int bitDelay = 1000000 / SAMPLE_RATE;
  byte data = 0;
  
  // Wait for start bit (LOW)
  unsigned long timeout = millis() + 1000;
  while (analogRead(PHOTODIODE_PIN) > THRESHOLD) {
    if (millis() > timeout) return 0;
    delayMicroseconds(bitDelay / 10);
  }
  
  delayMicroseconds(bitDelay * 1.5);  // Wait to middle of first data bit
  
  // Read 8 data bits
  for (int i = 0; i < 8; i++) {
    bool bit = analogRead(PHOTODIODE_PIN) > THRESHOLD;
    data |= (bit << i);
    delayMicroseconds(bitDelay);
  }
  
  return data;
}

bool receiveMessage() {
  // Look for preamble
  int preambleCount = 0;
  for (int i = 0; i < 50; i++) {
    byte b = receiveByte();
    if (b == 0xAA) {
      preambleCount++;
      if (preambleCount >= 5) break;
    } else {
      preambleCount = 0;
    }
  }
  
  if (preambleCount < 5) {
    return false;  // No valid preamble
  }
  
  // Read message length
  byte len = receiveByte();
  if (len == 0 || len > 255) return false;
  
  // Read message data
  for (int i = 0; i < len; i++) {
    rxBuffer[i] = receiveByte();
  }
  rxBuffer[len] = '\0';
  
  // Read and verify checksum
  byte receivedChecksum = receiveByte();
  byte calculatedChecksum = 0;
  for (int i = 0; i < len; i++) {
    calculatedChecksum ^= rxBuffer[i];
  }
  
  if (receivedChecksum != calculatedChecksum) {
    Serial.println("Checksum error!");
    return false;
  }
  
  return true;
}

// ===== MQTT Publishing =====
void publishReceivedMessage(const char* message) {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["message"] = message;
  doc["timestamp"] = millis();
  doc["signalStrength"] = analogRead(PHOTODIODE_PIN);
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  mqttClient.publish("lifi/receive", buffer);
}

void publishStatus() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["type"] = "receiver";
  doc["status"] = "online";
  doc["uptime"] = millis() / 1000;
  doc["wifiRSSI"] = WiFi.RSSI();
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["signalLevel"] = analogRead(PHOTODIODE_PIN);
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  mqttClient.publish("lifi/status", buffer);
}
```

## Calibration and Testing

### 1. Signal Strength Calibration

```cpp
void calibrateThreshold() {
  Serial.println("Calibrating threshold...");
  Serial.println("Cover photodiode (dark) and press any key");
  while (!Serial.available());
  Serial.read();
  
  int darkValue = analogRead(PHOTODIODE_PIN);
  Serial.print("Dark value: ");
  Serial.println(darkValue);
  
  Serial.println("Expose photodiode to LED and press any key");
  while (!Serial.available());
  Serial.read();
  
  int lightValue = analogRead(PHOTODIODE_PIN);
  Serial.print("Light value: ");
  Serial.println(lightValue);
  
  int threshold = (darkValue + lightValue) / 2;
  Serial.print("Recommended threshold: ");
  Serial.println(threshold);
}
```

### 2. Range Testing

```cpp
void testRange() {
  Serial.println("Range test - Move receiver away from transmitter");
  
  for (int distance = 10; distance <= 100; distance += 10) {
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" cm - Press any key to test");
    while (!Serial.available());
    Serial.read();
    
    int signalStrength = analogRead(PHOTODIODE_PIN);
    Serial.print("Signal strength: ");
    Serial.println(signalStrength);
  }
}
```

## Troubleshooting

### Common Issues

1. **No Wi-Fi connection**
   - Verify SSID and password
   - Check if network is 2.4GHz (ESP32 doesn't support 5GHz)
   - Move closer to router

2. **MQTT connection fails**
   - Verify server IP and port
   - Check firewall rules
   - Ensure broker is running

3. **No Li-Fi transmission**
   - Check LED connection and polarity
   - Verify GPIO pin number
   - Measure LED current (should be > 20mA)

4. **Receiver not detecting signal**
   - Calibrate threshold value
   - Check photodiode connection
   - Ensure direct line of sight
   - Reduce ambient light

5. **High error rate**
   - Reduce transmission distance
   - Increase LED brightness
   - Use Fresnel lens
   - Lower baud rate

## Performance Optimization

### Increasing Data Rate

```cpp
// Use faster modulation
const int MODULATION_RATE = 10000;  // 10 kbps

// Use PWM for smoother transitions
ledcSetup(0, 5000, 8);  // Channel 0, 5kHz, 8-bit
ledcAttachPin(LED_PIN, 0);
ledcWrite(0, 255);  // Full brightness
```

### Error Correction

```cpp
// Add Reed-Solomon error correction
#include <RS-FEC.h>

RS::ReedSolomon<255, 223> rs;
byte encoded[255];
byte decoded[223];

// Encode before transmission
rs.Encode(message, encoded);
transmitMessage(encoded, 255);

// Decode after reception
rs.Decode(received, decoded);
```

## Advanced Features

### Frequency Division Multiplexing

```cpp
// Use multiple LEDs with different colors
const int RED_LED = 2;
const int GREEN_LED = 4;
const int BLUE_LED = 5;

// Transmit different data on each channel
void transmitMultiChannel(const char* data1, const char* data2, const char* data3) {
  // Transmit data1 on red LED
  // Transmit data2 on green LED
  // Transmit data3 on blue LED
}
```

### Adaptive Modulation

```cpp
// Adjust modulation based on channel quality
void adaptiveTransmit(const char* message, int signalQuality) {
  if (signalQuality > 80) {
    MODULATION_RATE = 10000;  // High speed
  } else if (signalQuality > 50) {
    MODULATION_RATE = 5000;   // Medium speed
  } else {
    MODULATION_RATE = 1000;   // Low speed, more reliable
  }
  
  transmitMessage(message);
}
```

## References

- [ESP32 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)
- [MQTT Protocol](https://mqtt.org/)
- [Visible Light Communication Basics](https://en.wikipedia.org/wiki/Visible_light_communication)
- [Li-Fi Technology Overview](https://purelifi.com/lifi-technology/)
