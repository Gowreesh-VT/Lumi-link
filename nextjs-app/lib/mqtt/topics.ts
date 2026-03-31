import type { MqttTopicMap } from './types';

const MQTT_TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX?.trim() || 'lifi';

function joinTopic(...segments: string[]): string {
  return segments
    .map((segment) => segment.trim().replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

export const MQTT_TOPICS: MqttTopicMap = {
  txSend: joinTopic(MQTT_TOPIC_PREFIX, 'tx', 'send'),
  txAck: joinTopic(MQTT_TOPIC_PREFIX, 'tx', 'ack'),
  rxData: joinTopic(MQTT_TOPIC_PREFIX, 'rx', 'data'),
  systemStatus: joinTopic(MQTT_TOPIC_PREFIX, 'system', 'status'),
  settingsUpdate: joinTopic(MQTT_TOPIC_PREFIX, 'settings', 'update'),
};

export const MQTT_SUBSCRIPTIONS = [
  MQTT_TOPICS.txAck,
  MQTT_TOPICS.rxData,
  MQTT_TOPICS.systemStatus,
] as const;
