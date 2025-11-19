import { create } from 'zustand';

type TransmissionStatus = 'idle' | 'running';

type AppState = {
  transmissionStatus: TransmissionStatus;
  ledOn: boolean;
  messages: { id: string; deviceId: string; message: string; timestamp: number }[];
  addMessage: (m: { id: string; deviceId: string; message: string; timestamp: number }) => void;
  clearMessages: () => void;
  toggleLed: () => void;
  startTransmission: () => void;
  stopTransmission: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  transmissionStatus: 'idle',
  ledOn: false,
  messages: [],
  addMessage: (m) => set((s) => ({ messages: [m, ...s.messages].slice(0, 1000) })),
  clearMessages: () => set({ messages: [] }),
  toggleLed: () => set((s) => ({ ledOn: !s.ledOn })),
  startTransmission: () => set({ transmissionStatus: 'running' }),
  stopTransmission: () => set({ transmissionStatus: 'idle' }),
}));


