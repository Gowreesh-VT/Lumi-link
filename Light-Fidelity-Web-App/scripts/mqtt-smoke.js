import 'dotenv/config';
import mqtt from 'mqtt';

const brokerUrl = process.env.MQTT_BROKER_URL;
const enabled = ['1', 'true', 'yes', 'on'].includes((process.env.MQTT_ENABLED || '').toLowerCase());
const topicPrefix = process.env.MQTT_TOPIC_PREFIX || 'lifi';
const topic = `${topicPrefix}/smoke-test`;

if (!enabled) {
  console.error('[mqtt-smoke] MQTT is disabled. Set MQTT_ENABLED=true first.');
  process.exit(1);
}

if (!brokerUrl) {
  console.error('[mqtt-smoke] MQTT_BROKER_URL is missing in .env');
  process.exit(1);
}

const client = mqtt.connect(brokerUrl, {
  clientId: process.env.MQTT_CLIENT_ID || `lumi-link-smoke-${Math.random().toString(16).slice(2)}`,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  connectTimeout: Number(process.env.MQTT_CONNECT_TIMEOUT_MS || 30_000),
  reconnectPeriod: 0,
  clean: true,
});

const payload = JSON.stringify({
  ping: 'ok',
  source: 'mqtt-smoke-script',
  timestamp: new Date().toISOString(),
});

const timeout = setTimeout(() => {
  console.error('[mqtt-smoke] Timed out waiting for response.');
  client.end(true);
  process.exit(1);
}, 15_000);

client.on('connect', () => {
  console.log(`[mqtt-smoke] Connected to ${brokerUrl}`);

  client.subscribe(topic, { qos: 1 }, (subscribeErr) => {
    if (subscribeErr) {
      console.error('[mqtt-smoke] Subscribe failed:', subscribeErr.message);
      clearTimeout(timeout);
      client.end(true);
      process.exit(1);
      return;
    }

    client.publish(topic, payload, { qos: 1 }, (publishErr) => {
      if (publishErr) {
        console.error('[mqtt-smoke] Publish failed:', publishErr.message);
        clearTimeout(timeout);
        client.end(true);
        process.exit(1);
      }
    });
  });
});

client.on('message', (incomingTopic, message) => {
  if (incomingTopic !== topic) return;

  console.log('[mqtt-smoke] Round-trip success:', message.toString('utf8'));
  clearTimeout(timeout);
  client.end(false, () => process.exit(0));
});

client.on('error', (error) => {
  console.error('[mqtt-smoke] Error:', error.message);
  clearTimeout(timeout);
  client.end(true);
  process.exit(1);
});
