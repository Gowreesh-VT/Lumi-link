const int ledPin = 23;    
const int bitDelay = 200; 

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

void loop() {
  if (Serial.available() > 0) {
    String msg = Serial.readStringUntil('\n');
    msg += '\n';

    for (int i = 0; i < (int)msg.length(); i++) {
      sendChar(msg[i]);

      delay(bitDelay * 5);  
    }

    digitalWrite(ledPin, LOW);
  }
}
