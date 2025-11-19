import { useEffect, useState } from 'react';
import { Button, Card, Input } from '../components/ui';

export default function Network() {
  const [ssid, setSsid] = useState('LiFiWiFi');
  const [password, setPassword] = useState('password123');
  const [connected, setConnected] = useState<boolean>(true);
  const [devices, setDevices] = useState<{ id: string; name: string; rssi: number }[]>([
    { id: 'esp32-01', name: 'ESP32 LiFi TX', rssi: -48 },
    { id: 'esp32-02', name: 'ESP32 LiFi RX', rssi: -52 },
  ]);

  useEffect(() => {
    // mock get status
    fetch((import.meta as any).env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api/status` : 'http://localhost:4000/api/status').catch(() => {});
  }, []);

  const save = async () => {
    await fetch((import.meta as any).env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api/settings` : 'http://localhost:4000/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssid, password }),
    }).catch(() => {});
  };

  const testConnection = async () => {
    setConnected(Math.random() > 0.1);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <div className="font-semibold mb-2">Wi-Fi Setup</div>
        <div className="grid gap-2">
          <label className="text-sm">SSID</label>
          <Input value={ssid} onChange={(e) => setSsid(e.target.value)} />
          <label className="text-sm">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex gap-2 mt-2">
            <Button onClick={save}>Save</Button>
            <Button variant="outline" onClick={testConnection}>Test connection</Button>
          </div>
          <div className="text-sm opacity-70 mt-2">Device status: {connected ? 'Online' : 'Offline'}</div>
        </div>
      </Card>
      <Card>
        <div className="font-semibold mb-2">Connected Devices</div>
        <div className="space-y-2">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{d.name}</div>
                <div className="opacity-70">{d.id}</div>
              </div>
              <div className="opacity-80">RSSI: {d.rssi} dBm</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


