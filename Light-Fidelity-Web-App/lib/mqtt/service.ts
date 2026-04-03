import type { MqttClient } from 'mqtt';
import { getOrCreateMqttClient, mqttPublish, mqttSubscribe } from './client';
import { MQTT_TOPICS } from './topics';
import type { MqttMessageEnvelope, MqttPublishOptions, MqttQos } from './types';

export async function publishJson<TPayload>(
  topic: string,
  payload: TPayload,
  options?: MqttPublishOptions,
): Promise<void> {
  const body = JSON.stringify(payload);
  await mqttPublish(topic, body, options);
}

export async function publishTxMessage(
  message: string,
  options?: MqttPublishOptions,
): Promise<void> {
  await publishJson(
    MQTT_TOPICS.txSend,
    {
      message,
      timestamp: new Date().toISOString(),
    },
    options,
  );
}

export async function publishSystemStatus(status: Record<string, unknown>): Promise<void> {
  await publishJson(MQTT_TOPICS.systemStatus, {
    ...status,
    timestamp: new Date().toISOString(),
  });
}

export async function subscribeWithParser<TPayload = unknown>(
  topic: string,
  onMessage: (packet: MqttMessageEnvelope<TPayload>) => void,
  qos: MqttQos = 1,
): Promise<() => void> {
  const { client } = getOrCreateMqttClient();
  await mqttSubscribe(topic, qos);

  const handler = (incomingTopic: string, message: Buffer, packet: { qos: MqttQos; retain: boolean }) => {
    if (incomingTopic !== topic) return;

    let payload: TPayload;
    try {
      payload = JSON.parse(message.toString('utf8')) as TPayload;
    } catch {
      payload = message.toString('utf8') as TPayload;
    }

    onMessage({
      topic: incomingTopic,
      qos: packet.qos,
      retain: packet.retain,
      timestamp: new Date().toISOString(),
      payload,
    });
  };

  client.on('message', handler);

  return () => {
    client.removeListener('message', handler);
    client.unsubscribe(topic);
  };
}

export function getRawMqttClient(): MqttClient {
  return getOrCreateMqttClient().client;
}
