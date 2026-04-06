const int ledPin = 23;
const int bitDelay = 200;
const unsigned long autoSendMs = 2500;

unsigned long lastAutoSendAt = 0;
int seqNo = 0;
bool sendRouteNext = false;

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);
}

void sendBit(int bitValue) {
  digitalWrite(ledPin, bitValue == 1 ? HIGH : LOW);
  delay(bitDelay);
}

void sendChar(char c) {
  int ascii = int(c);

  sendBit(1);

  for (int i = 7; i >= 0; i--) {
    sendBit((ascii >> i) & 1);
  }

  sendBit(0);
}

void sendMessage(const String& msg) {
  for (int i = 0; i < (int)msg.length(); i++) {
    sendChar(msg[i]);
    delay(bitDelay * 2);
  }
  digitalWrite(ledPin, LOW);
}

uint8_t crc8Simple(const String& payload) {
  uint8_t crc = 0;
  for (int i = 0; i < payload.length(); i++) {
    crc ^= (uint8_t)payload[i];
  }
  return crc;
}

String toHex2(uint8_t value) {
  const char* hex = "0123456789ABCDEF";
  String out = "";
  out += hex[(value >> 4) & 0x0F];
  out += hex[value & 0x0F];
  return out;
}

String buildFramedLiFi(const String& jsonPayload) {
  uint8_t crc = crc8Simple(jsonPayload);
  String framed = "LIFI:";
  framed += jsonPayload;
  framed += "|";
  framed += toHex2(crc);
  framed += "\n";
  return framed;
}

String buildPacket() {
  seqNo++;
  int smoke = 120 + ((seqNo * 17) % 80);
  int gas = 90 + ((seqNo * 13) % 70);
  float temperature = 26.0 + ((seqNo % 10) * 0.4);
  float humidity = 52.0 + ((seqNo % 8) * 0.5);
  int shock = ((seqNo % 25) == 0) ? 1 : 0;
  int motion = ((seqNo % 3) == 0) ? 1 : 0;

  String jsonPayload = "{\"type\":\"sensor\",\"node\":\"TX-01\",\"seq\":";
  jsonPayload += seqNo;
  jsonPayload += ",\"smoke\":";
  jsonPayload += smoke;
  jsonPayload += ",\"gas\":";
  jsonPayload += gas;
  jsonPayload += ",\"temperature\":";
  jsonPayload += String(temperature, 1);
  jsonPayload += ",\"humidity\":";
  jsonPayload += String(humidity, 1);
  jsonPayload += ",\"shock\":";
  jsonPayload += shock;
  jsonPayload += ",\"motion\":";
  jsonPayload += motion;
  jsonPayload += "}";
  return buildFramedLiFi(jsonPayload);
}

String buildRoutePacket() {
  seqNo++;

  const char* turns[] = {"LEFT", "FORWARD", "RIGHT", "U_TURN", "FORWARD_RIGHT", "FORWARD_LEFT"};
  int turnIndex = seqNo % 6;
  float distanceM = 24.0 - ((seqNo % 20) * 0.9);
  if (distanceM < 2.0) {
    distanceM = 24.0;
  }

  String jsonPayload = "{\"type\":\"route\",\"node\":\"TX-01\",\"seq\":";
  jsonPayload += seqNo;
  jsonPayload += ",\"next_turn\":\"";
  jsonPayload += turns[turnIndex];
  jsonPayload += "\",\"distance_m\":";
  jsonPayload += String(distanceM, 1);
  jsonPayload += ",\"target_exit\":\"EAST-STAIR-2\",\"hazard\":\"fire\",\"ttl_ms\":2500}";
  return buildFramedLiFi(jsonPayload);
}

void loop() {
  // Manual override mode: send any serial line as-is over LiFi.
  if (Serial.available() > 0) {
    String msg = Serial.readStringUntil('\n');
    msg += '\n';
    sendMessage(msg);
    return;
  }

  // Auto telemetry mode for prototype integration with Firefly.
  if (millis() - lastAutoSendAt >= autoSendMs) {
    String payload = sendRouteNext ? buildRoutePacket() : buildPacket();
    sendMessage(payload);
    lastAutoSendAt = millis();
    sendRouteNext = !sendRouteNext;
  }
}
