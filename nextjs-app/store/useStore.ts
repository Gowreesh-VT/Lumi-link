import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  content: string;
  /** ISO 8601 string — use `new Date(timestamp)` when displaying */
  timestamp: string;
  direction: 'sent' | 'received';
  status: 'success' | 'error' | 'pending';
}

interface SystemStatus {
  lifiConnected: boolean;
  txConnected: boolean;
  rxConnected: boolean;
  wifiConnected: boolean;
  dataRate: number;
  errorRate: number;
  signalStrength: number;
  ledStatus: boolean;
}

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  systemStatus: SystemStatus;
  updateSystemStatus: (status: Partial<SystemStatus>) => void;

  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessageStatus: (id: string, status: Message['status']) => void;
  clearMessages: () => void;

  isTransmitting: boolean;
  setIsTransmitting: (value: boolean) => void;

  wifiSettings: { ssid: string; password: string };
  updateWifiSettings: (settings: Partial<AppState['wifiSettings']>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      systemStatus: {
        lifiConnected: false,
        txConnected: false,
        rxConnected: false,
        wifiConnected: false,
        dataRate: 0,
        errorRate: 0,
        signalStrength: 0,
        ledStatus: false,
      },
      updateSystemStatus: (status) =>
        set((s) => ({ systemStatus: { ...s.systemStatus, ...status } })),

      messages: [],
      addMessage: (message) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { ...message, id: Math.random().toString(36).slice(2, 9), timestamp: new Date().toISOString() },
          ].slice(-100), // keep last 100, newest at the end
        })),
      updateMessageStatus: (id, status) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, status } : m)),
        })),
      clearMessages: () => set({ messages: [] }),

      isTransmitting: false,
      setIsTransmitting: (value) => set({ isTransmitting: value }),

      wifiSettings: { ssid: 'LiFi-Network', password: '' },
      updateWifiSettings: (settings) =>
        set((s) => ({ wifiSettings: { ...s.wifiSettings, ...settings } })),
    }),
    {
      name: 'lumi-link-storage',
      partialize: (s) => ({ theme: s.theme, wifiSettings: s.wifiSettings }),
    }
  )
);
