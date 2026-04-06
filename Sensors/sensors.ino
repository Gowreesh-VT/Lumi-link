#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT22

#define SMOKE_PIN A0
#define GAS_PIN A1
#define SHOCK_PIN 3
#define MOTION_PIN 4

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  
  pinMode(SHOCK_PIN, INPUT);
  pinMode(MOTION_PIN, INPUT);
  
  dht.begin();
}

void loop() {

  // Read Sensors
  int smokeValue = analogRead(SMOKE_PIN);
  int gasValue = analogRead(GAS_PIN);
  
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  int shockState = digitalRead(SHOCK_PIN);
  int motionState = digitalRead(MOTION_PIN);

  // Create JSON manually
  Serial.print("{");

  Serial.print("\"smoke\":");
  Serial.print(smokeValue);
  Serial.print(",");

  Serial.print("\"gas\":");
  Serial.print(gasValue);
  Serial.print(",");

  Serial.print("\"temperature\":");
  Serial.print(temperature);
  Serial.print(",");

  Serial.print("\"humidity\":");
  Serial.print(humidity);
  Serial.print(",");

  Serial.print("\"shock\":");
  Serial.print(shockState);
  Serial.print(",");

  Serial.print("\"motion\":");
  Serial.print(motionState);

  Serial.println("}");

  delay(2000);
}