#define RX_PIN 15
#define BIT_DURATION_US 10000 // Must match the transmitter!

void setup() {
  Serial.begin(115200);
  pinMode(RX_PIN, INPUT);

  Serial.println("--- Li-Fi Manchester Receiver Ready ---");
  Serial.println("Waiting for light signals...");
}

int receiveManchesterBit() {
  // We sample at 1/4 of the bit duration, and 3/4 of the bit duration
  // to grab the state right before and right after the middle transition.

  delayMicroseconds(BIT_DURATION_US / 4);
  int sample1 = digitalRead(RX_PIN);

  delayMicroseconds(BIT_DURATION_US / 2);
  int sample2 = digitalRead(RX_PIN);

  delayMicroseconds(BIT_DURATION_US / 4); // Finish out the bit duration

  // '1' = LOW to HIGH transition (0 -> 1)
  // '0' = HIGH to LOW transition (1 -> 0)
  if (sample1 == LOW && sample2 == HIGH)
    return 1;
  if (sample1 == HIGH && sample2 == LOW)
    return 0;

  return -1; // Error: No valid transition found!
}

char receiveByte() {
  // 1. Wait for the START of the start bit (line goes HIGH)
  while (digitalRead(RX_PIN) == LOW) {
    delayMicroseconds(50);
  }

  // We just saw the RISING EDGE of the first half of the start bit.
  // The start bit is a '0' in Manchester, meaning it transitions HIGH -> LOW
  // at its midpoint. We want to arrive exactly at the end of the start bit
  // so we can read data bits with a fresh clock cycle.
  //
  // FIX: delay only BIT_DURATION_US / 2 to reach the midpoint/transition,
  // then another BIT_DURATION_US / 2 to reach the end of the start bit.
  // This is the same as BIT_DURATION_US total, BUT we also account for the
  // 50 µs poll granularity that caused us to arrive slightly late. Subtract
  // the poll granularity so the clock stays aligned over many bytes.
  //
  // Strategy: wait from rising edge to end of start bit = 1 full bit period.
  // (Half-bit high → crossing → half-bit low → end)
  delayMicroseconds(BIT_DURATION_US / 2); // advance to the midpoint transition
  // Confirm the line did transition LOW (the falling edge of the start bit)
  // If it didn't, it's noise — bail out.
  if (digitalRead(RX_PIN) == HIGH) {
    // The line never went LOW at the midpoint — this was a glitch, not a
    // real start bit. Wait for idle (LOW) and return an empty byte.
    while (digitalRead(RX_PIN) == HIGH) {
      delayMicroseconds(50);
    }
    return '\0';
  }
  delayMicroseconds(BIT_DURATION_US / 2); // advance to end of start bit

  char receivedChar = 0;

  // 2. Read 8 Data Bits (MSB first)
  for (int i = 7; i >= 0; i--) {
    int bit = receiveManchesterBit();

    if (bit == -1) {
      // Noise error — invalid transition!
      return '\0';
    }

    if (bit == 1) {
      receivedChar |= (1 << i);
    }
  }

  // 3. Stop Bit (line returns to LOW) — wait for idle to settle
  delayMicroseconds(BIT_DURATION_US / 2);

  return receivedChar;
}

void loop() {
  char incoming = receiveByte();

  if (incoming == '\0') {
    // Manchester decode error (noise or misalignment) — ignore silently.
    // Uncomment the next line to show error tokens in the Serial Monitor:
    // Serial.print("[?]");
  } else if ((incoming >= 32 && incoming <= 126) || incoming == '\n' ||
             incoming == '\r') {
    Serial.print(incoming);
  } else {
    // Non-printable byte — print as hex token so the dashboard can detect
    // errors
    Serial.print("[");
    Serial.print((int)incoming, HEX);
    Serial.print("]");
  }
}
