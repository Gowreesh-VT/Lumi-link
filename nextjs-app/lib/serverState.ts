/**
 * lib/serverState.ts
 *
 * In-process singleton shared between server.js (Socket.io / SerialPort layer)
 * and Next.js API route handlers.  Because the custom server (server.js) and
 * Next.js API routes run in the same Node process, Node's module cache makes
 * this the same object instance everywhere it is imported.
 *
 * NOTE: this module must NOT be imported by client-side code.
 */

export interface StoredMessage {
    id: string;
    content: string;
    direction: 'sent' | 'received';
    status: 'success' | 'error' | 'pending';
    timestamp: string; // ISO 8601
}

export interface HardwareStatus {
    lifiConnected: boolean;
    txConnected: boolean;
    rxConnected: boolean;
    transmissionActive: boolean;
    updatedAt: string;
}

export interface WifiSettings {
    ssid: string;
    // password is write-only; never returned by GET /api/settings
}

/* ── Mutable state ─────────────────────────────────────────────────────────── */

const MAX_MESSAGES = 200;

const state = {
    messages: [] as StoredMessage[],
    hardware: {
        lifiConnected: false,
        txConnected: false,
        rxConnected: false,
        transmissionActive: true,
        updatedAt: new Date().toISOString(),
    } as HardwareStatus,
    wifiSettings: {
        ssid: 'LiFi-Network',
    } as WifiSettings,
};

/* ── Messages ──────────────────────────────────────────────────────────────── */

export function addStoredMessage(msg: Omit<StoredMessage, 'id' | 'timestamp'>): StoredMessage {
    const full: StoredMessage = {
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

export function updateStoredMessageStatus(id: string, status: StoredMessage['status']) {
    const msg = state.messages.find((m) => m.id === id);
    if (msg) msg.status = status;
}

export function getStoredMessages(): StoredMessage[] {
    return [...state.messages];
}

export function clearStoredMessages() {
    state.messages = [];
}

/* ── Hardware status ───────────────────────────────────────────────────────── */

export function updateHardwareStatus(patch: Partial<HardwareStatus>) {
    Object.assign(state.hardware, patch, { updatedAt: new Date().toISOString() });
}

export function getHardwareStatus(): HardwareStatus {
    return { ...state.hardware };
}

/* ── Wi-Fi settings ────────────────────────────────────────────────────────── */

export function getWifiSettings(): WifiSettings {
    return { ...state.wifiSettings };
}

export function updateWifiSettings(patch: Partial<WifiSettings>) {
    Object.assign(state.wifiSettings, patch);
}
