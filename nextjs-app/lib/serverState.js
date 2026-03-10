/**
 * lib/serverState.js
 *
 * Plain-JS singleton imported by server.js (Node ESM, no TS compilation).
 * The TypeScript counterpart (serverState.ts) is imported by Next.js API routes
 * after transpilation — both resolve to the same module cache entry at runtime
 * because they share the same process.
 */

const MAX_MESSAGES = 200;

const state = {
  messages: [],
  hardware: {
    lifiConnected: false,
    txConnected: false,
    rxConnected: false,
    transmissionActive: true,
    updatedAt: new Date().toISOString(),
  },
  wifiSettings: {
    ssid: 'LiFi-Network',
  },
};

// ── Messages ──────────────────────────────────────────────────────────────────

export function addStoredMessage(msg) {
  const full = {
    ...msg,
    id: Math.random().toString(36).slice(2, 9),
    timestamp: new Date().toISOString(),
  };
  state.messages.push(full);
  if (state.messages.length > MAX_MESSAGES) {
    state.messages = state.messages.slice(-MAX_MESSAGES);
  }
  return full;
}

export function updateStoredMessageStatus(id, status) {
  const msg = state.messages.find((m) => m.id === id);
  if (msg) msg.status = status;
}

export function getStoredMessages() {
  return [...state.messages];
}

export function clearStoredMessages() {
  state.messages = [];
}

// ── Hardware status ───────────────────────────────────────────────────────────

export function updateHardwareStatus(patch) {
  Object.assign(state.hardware, patch, { updatedAt: new Date().toISOString() });
}

export function getHardwareStatus() {
  return { ...state.hardware };
}

// ── Wi-Fi settings ────────────────────────────────────────────────────────────

export function getWifiSettings() {
  return { ...state.wifiSettings };
}

export function updateWifiSettings(patch) {
  Object.assign(state.wifiSettings, patch);
}
