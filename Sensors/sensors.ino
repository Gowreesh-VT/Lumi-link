#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT22

#define SMOKE_PIN A0
#define GAS_PIN A1
#define LIFI_LED_PIN 8
#define LIFI_BIT_DELAY_MS 2
#define LOOP_DELAY_MS 500
#define SOS_TX_GAP_MS 20
#define SERIAL_PRINT_INTERVAL_MS 1500

DHT dht(DHTPIN, DHTTYPE);
int seqNo = 0;
bool sosBlinkEnabled = false;
unsigned long lastSerialPrintMs = 0;

void sendBit(int bitValue) {
  digitalWrite(LIFI_LED_PIN, bitValue == 1 ? HIGH : LOW);
  delay(LIFI_BIT_DELAY_MS);
}

void sendChar(char c) {
  int ascii = int(c);

  // Start bit (HIGH), 8 data bits (MSB first), stop bit (LOW).
  sendBit(1);
  for (int i = 7; i >= 0; i--) {
    sendBit((ascii >> i) & 1);
  }
  sendBit(0);
}

void sendLiFiMessage(const String& msg) {
  for (int i = 0; i < (int)msg.length(); i++) {
    sendChar(msg[i]);
  }
  digitalWrite(LIFI_LED_PIN, LOW);
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

void processSerialCommands() {
  while (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.equalsIgnoreCase("SOS_ON")) {
      sosBlinkEnabled = true;
      Serial.println("{\"type\":\"ack\",\"cmd\":\"SOS_ON\"}");
    } else if (cmd.equalsIgnoreCase("SOS_OFF")) {
      sosBlinkEnabled = false;
      digitalWrite(LIFI_LED_PIN, HIGH);
      Serial.println("{\"type\":\"ack\",\"cmd\":\"SOS_OFF\"}");
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LIFI_LED_PIN, OUTPUT);
  digitalWrite(LIFI_LED_PIN, HIGH);

  dht.begin();
}

void loop() {

  processSerialCommands();

  // Read Sensors
  int smokeValue = analogRead(SMOKE_PIN);
  int gasValue = analogRead(GAS_PIN);
  
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();


  int shockState = 0;
  int motionState = 0;
  seqNo++;

  // Create JSON payload used by Firefly sensor parser.
  String jsonPayload = "{";

  jsonPayload += "\"type\":\"sensor\",";
  jsonPayload += "\"node\":\"UNO-01\",";
  jsonPayload += "\"seq\":";
  jsonPayload += seqNo;
  jsonPayload += ",";

  jsonPayload += "\"smoke\":";
  jsonPayload += smokeValue;
  jsonPayload += ",";

  jsonPayload += "\"gas\":";
  jsonPayload += gasValue;
  jsonPayload += ",";

  jsonPayload += "\"temperature\":";
  jsonPayload += String(temperature, 1);
  jsonPayload += ",";

  jsonPayload += "\"humidity\":";
  jsonPayload += String(humidity, 1);
  jsonPayload += ",";

  jsonPayload += "\"shock\":";
  jsonPayload += shockState;
  jsonPayload += ",";

  jsonPayload += "\"motion\":";
  jsonPayload += motionState;
  jsonPayload += "}";

  // Slow serial monitor printing so logs are easier to read.
  unsigned long now = millis();
  if (now - lastSerialPrintMs >= SERIAL_PRINT_INTERVAL_MS) {
    Serial.println(jsonPayload);
    lastSerialPrintMs = now;
  }

  // SOS mode: transmit the real sensor JSON as LiFi frame over LED.
  if (sosBlinkEnabled) {
    String framed = buildFramedLiFi(jsonPayload);
    sendLiFiMessage(framed);
  } else {
    digitalWrite(LIFI_LED_PIN, HIGH);
  }

  if (sosBlinkEnabled) {
    // Keep LiFi transfer continuous during SOS mode.
    delay(SOS_TX_GAP_MS);
  } else {
    delay(LOOP_DELAY_MS);
  }
}