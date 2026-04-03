// Run: npm run list-ports
// Lists all available serial ports to help you find your ESP32 port path.

import { SerialPort } from 'serialport';

const ports = await SerialPort.list();

if (ports.length === 0) {
  console.log('No serial ports found. Make sure your ESP32 is plugged in via USB.');
} else {
  console.log('Available serial ports:\n');
  for (const p of ports) {
    console.log(`  Path:         ${p.path}`);
    console.log(`  Manufacturer: ${p.manufacturer ?? 'Unknown'}`);
    console.log(`  Serial#:      ${p.serialNumber ?? 'Unknown'}`);
    console.log('  ---');
  }
  console.log('\nCopy the right paths to your .env file as TX_PORT and RX_PORT.');
}
