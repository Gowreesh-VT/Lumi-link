// -------- Li-Fi Transmitter (NRZ) --------
// LED on GPIO 23. Reads messages from Serial (typed in Serial Monitor
// OR sent by server.js) and transmits them bit-by-bit via the LED.

const int ledPin = 23;    // GPIO 23 → 220Ω → LED → GND
const int bitDelay = 200; // milliseconds per bit (must match receiver)

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  Serial.println("--- Li-Fi NRZ Transmitter Ready ---");
  Serial.println("Type a message and press Enter to send.");
}

void sendBit(int bitValue) {
  digitalWrite(ledPin, bitValue == 1 ? HIGH : LOW);
  delay(bitDelay);
}

void sendChar(char c) {
  int ascii = int(c);
  // Optional start bit so receiver can sync: LED LOW for 1 bit
  sendBit(0);
  // 8 data bits, MSB first
  for (int i = 7; i >= 0; i--) {
    sendBit((ascii >> i) & 1);
  }
  // Stop bit: LED LOW
  sendBit(0);
}

void loop() {
  if (Serial.available() > 0) {
    String msg = Serial.readStringUntil('\n');
    msg += '\n';

    Serial.print("Sending: ");
    Serial.print(msg);

    for (int i = 0; i < (int)msg.length(); i++) {
      sendChar(msg[i]);
    }

    // Idle: LED OFF between messages
    digitalWrite(ledPin, LOW);
  }
}
