import client from 'prom-client';

// Create a Registry
export const metricsRegistry = new client.Registry();

// Enable default metrics (CPU, RAM, Event Loop)
client.collectDefaultMetrics({ register: metricsRegistry });

// Custom Li-Fi Metrics
export const lifiMessagesSent = new client.Counter({
  name: 'lifi_messages_sent_total',
  help: 'Total number of valid messages sent by the Node server over the Li-Fi channel',
});
metricsRegistry.registerMetric(lifiMessagesSent);

export const lifiBytesSent = new client.Counter({
  name: 'lifi_bytes_sent_total',
  help: 'Total number of bytes written to the TX ESP32',
});
metricsRegistry.registerMetric(lifiBytesSent);

export const lifiMessagesReceived = new client.Counter({
  name: 'lifi_messages_received_total',
  help: 'Total number of valid messages successfully decoded and received over Li-Fi',
});
metricsRegistry.registerMetric(lifiMessagesReceived);

export const lifiBytesReceived = new client.Counter({
  name: 'lifi_bytes_received_total',
  help: 'Total number of raw bytes received from the RX ESP32',
});
metricsRegistry.registerMetric(lifiBytesReceived);

export const lifiDecodedErrors = new client.Counter({
  name: 'lifi_decode_errors_total',
  help: 'Total number of physical bit errors or parsing corruptions detected by the Receiver',
});
metricsRegistry.registerMetric(lifiDecodedErrors);

export const lifiHardwareConnected = new client.Gauge({
  name: 'lifi_hardware_connected',
  help: 'Status of the ESP32 hardware connection (1 = both TX and RX active, 0 = disconnected)',
});
metricsRegistry.registerMetric(lifiHardwareConnected);
