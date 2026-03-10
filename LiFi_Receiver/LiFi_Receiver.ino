// -------- Li-Fi Receiver (NRZ) --------
// LDR on GPIO 34 (ADC1 — more reliable than ADC2 on ESP32).
// Wiring: 3.3V → LDR → GPIO34 → 10kΩ → GND
//         (or any voltage divider giving ~500 dark, ~2500+ bright)

const int sensorPin = 34; // ADC1 channel 6 — reliable on ESP32
const int threshold =
    1500;                 // midpoint: dark~500, bright~2670 (adjust if needed)
const int bitDelay = 200; // ms per bit — must match transmitter!

void setup() {
  Serial.begin(115200);
  Serial.println("--- Li-Fi NRZ Receiver Ready ---");
  Serial.println("Waiting for light signals...");
}

int readBit() { return (analogRead(sensorPin) >= threshold) ? 1 : 0; }

// Sample in the middle of a bit period
int sampleBit() {
  delay(bitDelay / 2); // wait to centre of bit
  int val = readBit();
  delay(bitDelay / 2); // finish bit period
  return val;
}

// Wait for idle LOW state (LED off) with timeout
bool waitForIdle(unsigned long timeoutMs = 2000) {
  unsigned long start = millis();
  while (readBit() != 0) {
    if (millis() - start > timeoutMs)
      return false;
    delay(10);
  }
  return true;
}

// Wait for start bit (LED goes LOW after idle)
bool waitForStartBit(unsigned long timeoutMs = 5000) {
  // First wait for any existing LOW to clear
  waitForIdle();
  // Now wait for a LOW — that's our start bit
  unsigned long start = millis();
  while (readBit() != 0) {
    if (millis() - start > timeoutMs)
      return false;
    delay(5);
  }
  return true;
}

char receiveChar() {
  // Wait for start bit (LOW)
  if (!waitForStartBit())
    return '\0';

  // Read 8 data bits, MSB first
  int ascii = 0;
  for (int i = 7; i >= 0; i--) {
    int bit = sampleBit();
    ascii = (ascii << 1) | bit;
  }

  // Consume stop bit
  sampleBit();

  return (char)ascii;
}

void loop() {
  char c = receiveChar();
  if (c == '\0')
    return; // timeout, retry

  // Print raw analog for Serial Plotter debugging (comment out in production)
  // Serial.println(analogRead(sensorPin));

  if ((c >= 32 && c <= 126) || c == '\n' || c == '\r') {
    Serial.print(c);
  } else {
    // Non-printable — show as hex token for dashboard error detection
    Serial.print("[");
    Serial.print((int)c, HEX);
    Serial.print("]");
  }
}
