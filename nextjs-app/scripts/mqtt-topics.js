import 'dotenv/config';

const prefix = (process.env.MQTT_TOPIC_PREFIX || 'lifi').replace(/^\/+|\/+$/g, '');

const topics = {
  txSend: `${prefix}/tx/send`,
  txAck: `${prefix}/tx/ack`,
  rxData: `${prefix}/rx/data`,
  systemStatus: `${prefix}/system/status`,
  settingsUpdate: `${prefix}/settings/update`,
};

console.log(topics);
