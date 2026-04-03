# MQTT Scaffold (Not Yet Wired To Website)

This folder now includes a complete MQTT backend scaffold that is **not connected** to pages, API routes, or server startup.

## What was added

- `lib/mqtt/types.ts`: shared MQTT types.
- `lib/mqtt/topics.ts`: project topic names and subscription defaults.
- `lib/mqtt/config.ts`: env parsing and validation.
- `lib/mqtt/client.ts`: lazy singleton MQTT client helpers.
- `lib/mqtt/service.ts`: JSON publish/subscribe utilities for Li-Fi messages.
- `scripts/mqtt-smoke.js`: manual smoke test (connect, subscribe, publish, receive).
- `.env.mqtt.example`: all MQTT env keys with safe defaults.

## Important

Nothing is auto-connected. The website and existing Socket/Serial flow continue to work exactly as before.

## Manual test only

1. Copy values from `.env.mqtt.example` into your `.env`.
2. Keep `MQTT_ENABLED=false` if you do not want runtime usage.
3. To manually test broker connectivity:

```bash
npm run mqtt:smoke
```

This script is independent from your Next.js pages and APIs.

## Suggested Li-Fi topics

- `lifi/tx/send`: outgoing messages to transmitter.
- `lifi/tx/ack`: transmitter acknowledgement.
- `lifi/rx/data`: receiver data stream.
- `lifi/system/status`: connectivity and health status.
- `lifi/settings/update`: runtime config updates.
