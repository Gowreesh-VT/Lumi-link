import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  direction: 'sent' | 'received';
  status: 'success' | 'error' | 'pending';
}

interface SystemStatus {
  lifiConnected: boolean;
  wifiConnected: boolean;
  dataRate: number;
  errorRate: number;
  signalStrength: number;
  ledStatus: boolean;
}

interface AppState {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // System status
  systemStatus: SystemStatus;
  updateSystemStatus: (status: Partial<SystemStatus>) => void;

  // Messages
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;

  // Transmission state
  isTransmitting: boolean;
  setIsTransmitting: (value: boolean) => void;

  // Network settings
  wifiSettings: {
    ssid: string;
    password: string;
  };
  updateWifiSettings: (settings: Partial<AppState['wifiSettings']>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // System status
      systemStatus: {
        lifiConnected: true,
        wifiConnected: true,
        dataRate: 10.5,
        errorRate: 0.02,
        signalStrength: 85,
        ledStatus: true,
      },
      updateSystemStatus: (status) =>
        set((state) => ({
          systemStatus: { ...state.systemStatus, ...status },
        })),

      // Messages
      messages: [],
      addMessage: (message) =>
        set((state) => ({
          messages: [
            {
              ...message,
              id: Math.random().toString(36).substr(2, 9),
              timestamp: new Date(),
            },
            ...state.messages,
          ].slice(0, 100), // Keep last 100 messages
        })),

      // Transmission state
      isTransmitting: false,
      setIsTransmitting: (value) => set({ isTransmitting: value }),

      // Network settings
      wifiSettings: {
        ssid: 'LiFi-Network',
        password: '',
      },
      updateWifiSettings: (settings) =>
        set((state) => ({
          wifiSettings: { ...state.wifiSettings, ...settings },
        })),
    }),
    {
      name: 'lifi-storage',
      partialize: (state) => ({
        theme: state.theme,
        wifiSettings: state.wifiSettings,
      }),
    }
  )
);
