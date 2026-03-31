const int sensorPin = 34;   
const int bitDelay  = 200;  

int threshold = 1500; 

void setup() {
  Serial.begin(115200);

  delay(1000); 

  long sum = 0;
  for (int i = 0; i < 20; i++) {
    sum += analogRead(sensorPin);
    delay(50);
  }

  int ambientLight = sum / 20;
  threshold = ambientLight + 400; 
}

int readBit() {
  return (analogRead(sensorPin) >= threshold) ? 1 : 0;
}

int sampleBit() {
  delay(bitDelay / 2);         
  int val = readBit();
  delay(bitDelay / 2);         
  return val;
}

bool waitForIdle(unsigned long timeoutMs = 2000) {
  unsigned long start = millis();
  while (readBit() != 0) { 
    if (millis() - start > timeoutMs) return false;
    delay(10);
  }
  return true;
}

bool waitForStartBit(unsigned long timeoutMs = 100) {
  waitForIdle();
  unsigned long start = millis();
  while (readBit() != 1) { 
    if (millis() - start > timeoutMs) return false;
    delay(5);
  }
  return true;
}

char receiveChar() {
  if (!waitForStartBit()) return '\0';

  delay(bitDelay);

  int ascii = 0;
  for (int i = 7; i >= 0; i--) {
    int bit = sampleBit();
    ascii = (ascii << 1) | bit;
  }

  sampleBit(); 

  delay(bitDelay); 

  return (char)ascii;
}

void loop() {
  char c = receiveChar();

  if (c != '\0') {

    if ((c >= 32 && c <= 126) || c == '\n' || c == '\r') {
      Serial.print(c);
    } else {
      Serial.print("[");
      Serial.print((int)c, HEX);
      Serial.print("]");
    }
  }
}
