#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT22

#define SMOKE_PIN A0
#define GAS_PIN A1
#define LIFI_LED_PIN 8
#define HEARTBEAT_ON_MS 80
#define HEARTBEAT_OFF_MS 80
#define LOOP_DELAY_MS 500

DHT dht(DHTPIN, DHTTYPE);
int seqNo = 0;

void blinkHeartbeat() {
  digitalWrite(LIFI_LED_PIN, HIGH);
  delay(HEARTBEAT_ON_MS);
  digitalWrite(LIFI_LED_PIN, LOW);
  delay(HEARTBEAT_OFF_MS);
}

void setup() {
  Serial.begin(115200);
  pinMode(LIFI_LED_PIN, OUTPUT);
  digitalWrite(LIFI_LED_PIN, LOW);

  dht.begin();
}

void loop() {

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

  // Direct mode: send plain JSON over USB serial to Firefly.
  Serial.println(jsonPayload);

  // Keep LED activity visible without using optical receiver decode.
  blinkHeartbeat();

  delay(LOOP_DELAY_MS);
}