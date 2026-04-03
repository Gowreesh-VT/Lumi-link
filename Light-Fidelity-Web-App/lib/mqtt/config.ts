import type { IClientOptions } from 'mqtt';
import { randomUUID } from 'crypto';
import type { MqttRuntimeConfig } from './types';

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

function parseNumber(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function getMqttRuntimeConfig(): MqttRuntimeConfig {
  const brokerUrl = process.env.MQTT_BROKER_URL?.trim() || '';
  const configuredClientId = process.env.MQTT_CLIENT_ID?.trim();
  const useTls = brokerUrl.startsWith('mqtts://') || brokerUrl.startsWith('wss://');

  return {
    enabled: parseBoolean(process.env.MQTT_ENABLED, false),
    brokerUrl,
    clientId: configuredClientId || `lumi-link-${randomUUID()}`,
    username: process.env.MQTT_USERNAME?.trim() || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    keepalive: parseNumber(process.env.MQTT_KEEPALIVE_SECONDS, 60),
    reconnectPeriod: parseNumber(process.env.MQTT_RECONNECT_MS, 1500),
    connectTimeout: parseNumber(process.env.MQTT_CONNECT_TIMEOUT_MS, 30_000),
    clean: parseBoolean(process.env.MQTT_CLEAN_SESSION, true),
    useTls,
  };
}

export function toMqttClientOptions(config: MqttRuntimeConfig): IClientOptions {
  return {
    clientId: config.clientId,
    username: config.username,
    password: config.password,
    keepalive: config.keepalive,
    reconnectPeriod: config.reconnectPeriod,
    connectTimeout: config.connectTimeout,
    clean: config.clean,
    protocol: config.useTls ? 'mqtts' : 'mqtt',
  };
}

export function assertMqttEnabled(config: MqttRuntimeConfig) {
  if (!config.enabled) {
    throw new Error('MQTT is disabled. Set MQTT_ENABLED=true in .env to enable it.');
  }

  if (!config.brokerUrl) {
    throw new Error('MQTT_BROKER_URL is not set.');
  }
}
