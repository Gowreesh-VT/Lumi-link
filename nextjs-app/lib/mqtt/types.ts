import type { IClientOptions, MqttClient } from 'mqtt';

export type MqttQos = 0 | 1 | 2;

export type MqttConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'error';

export interface MqttRuntimeConfig {
  enabled: boolean;
  brokerUrl: string;
  clientId: string;
  username?: string;
  password?: string;
  keepalive: number;
  reconnectPeriod: number;
  connectTimeout: number;
  clean: boolean;
  useTls: boolean;
}

export interface MqttTopicMap {
  txSend: string;
  txAck: string;
  rxData: string;
  systemStatus: string;
  settingsUpdate: string;
}

export interface MqttMessageEnvelope<TPayload = unknown> {
  topic: string;
  qos: MqttQos;
  retain: boolean;
  timestamp: string;
  payload: TPayload;
}

export interface MqttPublishOptions {
  qos?: MqttQos;
  retain?: boolean;
}

export interface MqttClientHandle {
  config: MqttRuntimeConfig;
  options: IClientOptions;
  client: MqttClient;
}
