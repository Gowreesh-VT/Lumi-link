// Mock data generation utilities

export interface SignalDataPoint {
  timestamp: Date;
  signalStrength: number;
  dataRate: number;
  errorRate: number;
}

export interface TransmissionLog {
  id: string;
  timestamp: Date;
  message: string;
  status: 'success' | 'error' | 'pending';
  bytesSent: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  ipAddress: string;
  status: 'online' | 'offline';
  lastSeen: Date;
}

// Generate signal data for charts
export const generateSignalData = (points: number = 50): SignalDataPoint[] => {
  const data: SignalDataPoint[] = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 2000); // 2 second intervals
    data.push({
      timestamp,
      signalStrength: 70 + Math.random() * 25 + Math.sin(i / 5) * 5,
      dataRate: 8 + Math.random() * 4 + Math.cos(i / 4) * 2,
      errorRate: Math.random() * 0.05,
    });
  }
  
  return data;
};

// Generate transmission logs
export const generateTransmissionLogs = (count: number = 20): TransmissionLog[] => {
  const messages = [
    'Hello from Li-Fi',
    'Testing data transmission',
    'System status update',
    'Sensor data packet',
    'Configuration sync',
    'Heartbeat signal',
  ];
  
  const logs: TransmissionLog[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    logs.push({
      id: `log-${i}`,
      timestamp: new Date(now.getTime() - i * 5000),
      message: messages[Math.floor(Math.random() * messages.length)],
      status: Math.random() > 0.1 ? 'success' : 'error',
      bytesSent: Math.floor(Math.random() * 1024) + 128,
    });
  }
  
  return logs;
};

// Generate mock device list
export const generateDevices = (): DeviceInfo[] => {
  return [
    {
      id: 'esp32-001',
      name: 'ESP32 Transmitter',
      ipAddress: '192.168.1.101',
      status: 'online',
      lastSeen: new Date(),
    },
    {
      id: 'esp32-002',
      name: 'ESP32 Receiver',
      ipAddress: '192.168.1.102',
      status: 'online',
      lastSeen: new Date(),
    },
    {
      id: 'rpi-sensor',
      name: 'Raspberry Pi Sensor',
      ipAddress: '192.168.1.103',
      status: 'offline',
      lastSeen: new Date(Date.now() - 3600000),
    },
  ];
};

// Generate analytics data for different time ranges
export const generateAnalyticsData = (range: 'hour' | 'day' | 'week') => {
  let points = 0;
  let interval = 0;
  
  switch (range) {
    case 'hour':
      points = 60;
      interval = 60000; // 1 minute
      break;
    case 'day':
      points = 48;
      interval = 1800000; // 30 minutes
      break;
    case 'week':
      points = 168;
      interval = 3600000; // 1 hour
      break;
  }
  
  const data = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * interval);
    data.push({
      timestamp,
      throughput: 8 + Math.random() * 5 + Math.sin(i / 10) * 2,
      packetLoss: Math.random() * 2,
      lightIntensity: 75 + Math.random() * 15 + Math.cos(i / 8) * 5,
    });
  }
  
  return data;
};

// CSV export utility
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      val instanceof Date ? val.toISOString() : val
    ).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
