#define LED_PIN 4
#define BIT_DURATION_US                                                        \
  10000 // 10ms per bit. Using microseconds for higher precision in half-bits

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW); // Idle state is LOW

  Serial.println("--- Li-Fi Manchester Transmitter Ready ---");
  Serial.println("Type text in the Serial Monitor and press Enter to send.");
}

void sendManchesterBit(int bit) {
  // Manchester Encoding:
  // '1' = LOW to HIGH transition in the middle of the bit
  // '0' = HIGH to LOW transition in the middle of the bit

  if (bit == 1) {
    digitalWrite(LED_PIN, LOW);
    delayMicroseconds(BIT_DURATION_US / 2);
    digitalWrite(LED_PIN, HIGH);
    delayMicroseconds(BIT_DURATION_US / 2);
  } else {
    digitalWrite(LED_PIN, HIGH);
    delayMicroseconds(BIT_DURATION_US / 2);
    digitalWrite(LED_PIN, LOW);
    delayMicroseconds(BIT_DURATION_US / 2);
  }
}

void sendByte(char c) {
  // 1. Start Bit
  // We'll use a distinct sequence to wake up the receiver.
  // A standard '0' transition is a good start pulse (HIGH then LOW).
  sendManchesterBit(0);

  // 2. Data Bits (8 bits, MSB first is standard for Manchester)
  for (int i = 7; i >= 0; i--) {
    int bit = (c >> i) & 0x01;
    sendManchesterBit(bit);
  }

  // 3. Stop Bit (Always LOW to return to idle)
  digitalWrite(LED_PIN, LOW);
  delayMicroseconds(BIT_DURATION_US * 2); // Idle time between bytes
}

void loop() {
  if (Serial.available() > 0) {
    String msg = Serial.readStringUntil('\n'); // Read user input
    msg += '\n';                               // Add newline for the receiver

    Serial.print("Sending: ");
    Serial.print(msg);

    // Send the message character by character
    for (int i = 0; i < msg.length(); i++) {
      sendByte(msg[i]);
    }
  }
}
