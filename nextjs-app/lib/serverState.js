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

export function updateHardwareStatus(patch) {
  Object.assign(state.hardware, patch, { updatedAt: new Date().toISOString() });
}

export function getHardwareStatus() {
  return { ...state.hardware };
}

export function getWifiSettings() {
  return { ...state.wifiSettings };
}

export function updateWifiSettings(patch) {
  Object.assign(state.wifiSettings, patch);
}
