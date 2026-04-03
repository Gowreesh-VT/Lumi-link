export interface SignalDataPoint {
  timestamp: Date;
  signalStrength: number;
  dataRate: number;
  errorRate: number;
}

export function generateSignalData(points = 50): SignalDataPoint[] {
  const data: SignalDataPoint[] = [];
  const now = new Date();
  for (let i = points - 1; i >= 0; i--) {
    data.push({
      timestamp: new Date(now.getTime() - i * 2000),
      signalStrength: 70 + Math.random() * 25 + Math.sin(i / 5) * 5,
      dataRate: 8 + Math.random() * 4 + Math.cos(i / 4) * 2,
      errorRate: Math.random() * 0.05,
    });
  }
  return data;
}

export interface DeviceInfo {
  id: string;
  name: string;
  ipAddress: string;
  status: 'online' | 'offline';
  lastSeen: Date;
}

export function generateDevices(): DeviceInfo[] {
  return [
    { id: '1', name: 'ESP32 Transmitter', ipAddress: '192.168.1.101', status: 'online', lastSeen: new Date() },
    { id: '2', name: 'ESP32 Receiver',    ipAddress: '192.168.1.102', status: 'online', lastSeen: new Date() },
    { id: '3', name: 'Raspberry Pi',      ipAddress: '192.168.1.103', status: 'offline', lastSeen: new Date(Date.now() - 3600000) },
  ];
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
