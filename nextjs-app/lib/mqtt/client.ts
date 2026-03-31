import { connect, type MqttClient } from 'mqtt';
import { assertMqttEnabled, getMqttRuntimeConfig, toMqttClientOptions } from './config';
import type { MqttClientHandle, MqttPublishOptions, MqttQos } from './types';

let handle: MqttClientHandle | null = null;

function createHandle(): MqttClientHandle {
  const config = getMqttRuntimeConfig();
  assertMqttEnabled(config);

  const options = toMqttClientOptions(config);
  const client = connect(config.brokerUrl, options);

  handle = { config, options, client };
  return handle;
}

export function getOrCreateMqttClient(): MqttClientHandle {
  if (handle) return handle;
  return createHandle();
}

export function getMqttClientOrNull(): MqttClient | null {
  return handle?.client || null;
}

export async function waitForMqttConnect(client: MqttClient): Promise<void> {
  if (client.connected) return;

  await new Promise<void>((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      client.removeListener('connect', onConnect);
      client.removeListener('error', onError);
    };

    client.once('connect', onConnect);
    client.once('error', onError);
  });
}

export async function mqttPublish(
  topic: string,
  payload: string | Buffer,
  options?: MqttPublishOptions,
): Promise<void> {
  const { client } = getOrCreateMqttClient();
  await waitForMqttConnect(client);

  await new Promise<void>((resolve, reject) => {
    client.publish(
      topic,
      payload,
      {
        qos: (options?.qos ?? 1) as MqttQos,
        retain: options?.retain ?? false,
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      },
    );
  });
}

export async function mqttSubscribe(topic: string, qos: MqttQos = 1): Promise<void> {
  const { client } = getOrCreateMqttClient();
  await waitForMqttConnect(client);

  await new Promise<void>((resolve, reject) => {
    client.subscribe(topic, { qos }, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function mqttDisconnect(force = false): Promise<void> {
  if (!handle) return;

  await new Promise<void>((resolve) => {
    handle?.client.end(force, {}, () => resolve());
  });

  handle = null;
}
