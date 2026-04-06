// -------- Li-Fi Receiver DIAGNOSTIC TEST --------
// Upload this BEFORE the real receiver to verify your sensor + threshold.
//
// What it does:
//   1. Continuously prints the raw ADC value so you can see dark vs bright.
//   2. Prints DARK or BRIGHT based on the threshold.
//   3. After calibration, runs a simple bit-reception test and prints decoded chars.
//
// Open Serial Monitor at 115200 baud.

const int sensorPin = 34;
const int bitDelay   = 200;   // ms — must match transmitter

// ── Step 1: Calibration ───────────────────────────────────────────────────────
// Watch the ADC values in Serial Monitor:
//   Cover the sensor (dark)  → note the LOW value
//   Point LED at sensor       → note the HIGH value
//   Set threshold = midpoint  e.g. (dark + bright) / 2
int threshold = 1500;

// ── Mode switch ───────────────────────────────────────────────────────────────
// 0 = raw ADC print (calibration mode)
// 1 = DARK/BRIGHT detection test
// 2 = full character receive test
const int MODE = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("=== Li-Fi Receiver Test ===");
  Serial.print("Sensor pin: GPIO"); Serial.println(sensorPin);
  Serial.print("Threshold : ");     Serial.println(threshold);
  Serial.print("Mode      : ");     Serial.println(MODE);
  Serial.println("---------------------------");
}

// ── Mode 0: raw ADC ───────────────────────────────────────────────────────────
void modeRaw() {
  int val = analogRead(sensorPin);
  Serial.print("ADC="); Serial.print(val);
  Serial.print("  → "); Serial.println(val >= threshold ? "BRIGHT (1)" : "DARK   (0)");
  delay(200);
}

// ── Mode 1: DARK/BRIGHT with hysteresis ──────────────────────────────────────
void modeBrightDark() {
  int val = analogRead(sensorPin);
  bool bright = val >= threshold;
  Serial.print(bright ? "█ BRIGHT " : "░ dark   ");
  Serial.print("ADC="); Serial.println(val);
  delay(100);
}

// ── Mode 2: character receive test ───────────────────────────────────────────
int readBit() { return (analogRead(sensorPin) >= threshold) ? 1 : 0; }

int sampleBit() {
  delay(bitDelay / 2);
  int v = readBit();
  delay(bitDelay / 2);
  return v;
}

bool waitForStartBit(unsigned long timeoutMs = 5000) {
  // Wait for idle (LED off = LOW)
  unsigned long t = millis();
  while (readBit() != 0) {
    if (millis() - t > timeoutMs) return false;
    delay(5);
  }
  // Wait for start bit (HIGH pulse) to match transmitter.
  t = millis();
  while (readBit() != 1) {
    if (millis() - t > timeoutMs) return false;
    delay(5);
  }
  return true;
}

void modeReceive() {
  // Print raw ADC while waiting so you can see sensor response
  int raw = analogRead(sensorPin);
  Serial.print("[waiting] ADC="); Serial.println(raw);

  if (!waitForStartBit(500)) return;

  int ascii = 0;
  for (int i = 7; i >= 0; i--) {
    int bit = sampleBit();
    ascii = (ascii << 1) | bit;
  }
  sampleBit(); // stop bit

  char c = (char)ascii;
  Serial.print("[RECV] ascii="); Serial.print(ascii);
  Serial.print(" char=");
  if (c >= 32 && c <= 126) Serial.println(c);
  else { Serial.print("[0x"); Serial.print(ascii, HEX); Serial.println("]"); }
}

void loop() {
  if      (MODE == 0) modeRaw();
  else if (MODE == 1) modeBrightDark();
  else                modeReceive();
}
