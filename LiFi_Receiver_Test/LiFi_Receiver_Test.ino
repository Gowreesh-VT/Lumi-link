const int sensorPin = 34;   
const int bitDelay = 20;
const int thresholdOffset = 35;
const int hysteresis = 12;
const bool invertSignal = false;

int threshold = 1500; 
String lineBuffer = "";
int prefixMatchIndex = 0;
int lastBitState = 0;

const char* framePrefix = "LIFI:";
const int framePrefixLen = 5;

void setup() {
  Serial.begin(115200);

  delay(1000); 

  long sum = 0;
  for (int i = 0; i < 20; i++) {
    sum += analogRead(sensorPin);
    delay(50);
  }

  int ambientLight = sum / 20;
  threshold = ambientLight + thresholdOffset;

  Serial.print("[LiFi RX] ambient=");
  Serial.print(ambientLight);
  Serial.print(" threshold=");
  Serial.print(threshold);
  Serial.print(" (offset=");
  Serial.print(thresholdOffset);
  Serial.print(", hysteresis=");
  Serial.print(hysteresis);
  Serial.print(", bitDelay=");
  Serial.print(bitDelay);
  Serial.print(", invert=");
  Serial.print(invertSignal ? "true" : "false");
  Serial.println(")");
}

int readBit() {
  int reading = analogRead(sensorPin);
  int highThreshold = threshold + hysteresis;
  int lowThreshold = threshold - hysteresis;

  // Schmitt-trigger style gating to suppress noise around threshold.
  if (reading >= highThreshold) {
    lastBitState = 1;
  } else if (reading <= lowThreshold) {
    lastBitState = 0;
  }

  return invertSignal ? 1 - lastBitState : lastBitState;
}

bool waitForIdle(unsigned long timeoutMs = 2000) {
  unsigned long start = millis();
  while (readBit() != 0) { 
    if (millis() - start > timeoutMs) return false;
    delay(10);
  }
  return true;
}

bool waitForStartBit(unsigned long timeoutMs = 1500) {
  waitForIdle();
  unsigned long start = millis();
  int prev = readBit();
  while (millis() - start <= timeoutMs) {
    int cur = readBit();
    // Detect a rising edge into the start bit and confirm it stays high at half-bit.
    if (prev == 0 && cur == 1) {
      delay(bitDelay / 2);
      if (readBit() == 1) {
        return true;
      }
    }
    prev = cur;
    delay(1);
  }
  return false;
}

char receiveChar() {
  if (!waitForStartBit()) return '\0';

  // Sample in the center of each data bit: 1.5 bit-times after start edge.
  delay(bitDelay + (bitDelay / 2));

  int ascii = 0;
  for (int i = 0; i < 8; i++) {
    int bit = readBit();
    ascii = (ascii << 1) | bit;
    delay(bitDelay);
  }

  // Validate expected stop bit (protocol uses LOW stop bit).
  if (readBit() != 0) {
    return '\0';
  }
  delay(bitDelay);

  return (char)ascii;
}

void loop() {
  char c = receiveChar();

  if (c != '\0') {
    if (c == '\r') {
      return;
    }

    if (c == '\n') {
      if (lineBuffer.length() > 0 && lineBuffer.startsWith(framePrefix)) {
        Serial.println(lineBuffer);
      }
      lineBuffer = "";
      prefixMatchIndex = 0;
      return;
    }

    if (c < 32 || c > 126) {
      lineBuffer = "";
      prefixMatchIndex = 0;
      return;
    }

    if (lineBuffer.length() == 0) {
      if (c == framePrefix[prefixMatchIndex]) {
        prefixMatchIndex++;
        if (prefixMatchIndex == framePrefixLen) {
          lineBuffer = framePrefix;
          prefixMatchIndex = 0;
        }
      } else {
        prefixMatchIndex = (c == framePrefix[0]) ? 1 : 0;
      }
      return;
    }

    if (lineBuffer.length() < 300) {
      lineBuffer += c;
    } else {
      lineBuffer = "";
      prefixMatchIndex = 0;
    }
  }
}
