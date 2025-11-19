import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button, Card, Badge } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { generateSeries } from '../utils/generate';
import { getSocket } from '../lib/socket';

export default function Dashboard() {
  const { transmissionStatus, startTransmission, stopTransmission } = useAppStore();
  const [data, setData] = useState(() => generateSeries(20, 50));
  const [signal, setSignal] = useState(50);
  const [wifi, setWifi] = useState<'connected' | 'disconnected'>('connected');

  useEffect(() => {
    const id = setInterval(() => {
      const next = Math.max(0, signal + (Math.random() - 0.5) * 5);
      setSignal(next);
      setData((d) => [...d.slice(-19), { t: (d.at(-1)?.t ?? 0) + 1, value: Math.round(next * 10) / 10 }]);
    }, 1000);
    return () => clearInterval(id);
  }, [signal]);

  useEffect(() => {
    const s = getSocket();
    s.on('message', () => setWifi('connected'));
    s.on('connect', () => setWifi('connected'));
    s.on('disconnect', () => setWifi('disconnected'));
    return () => {
      s.off('message');
    };
  }, []);

  const stats = useMemo(() => ({
    lifi: signal > 20 ? 'Active' : 'Idle',
    wifi,
    dataRate: `${(signal / 10).toFixed(2)} Mbps`,
    errorRate: `${Math.max(0, (60 - signal) / 100).toFixed(2)} %`,
  }), [signal, wifi]);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <Card>
          <div className="text-sm opacity-70">Li-Fi Status</div>
          <div className="mt-1 flex items-center gap-2 text-xl font-semibold">
            {stats.lifi}
            <Badge color={stats.lifi === 'Active' ? 'green' : 'red'}>{stats.lifi === 'Active' ? 'OK' : 'Idle'}</Badge>
          </div>
        </Card>
        <Card>
          <div className="text-sm opacity-70">Wi-Fi Connection</div>
          <div className="mt-1 flex items-center gap-2 text-xl font-semibold">
            {stats.wifi}
            <Badge color={stats.wifi === 'connected' ? 'green' : 'red'}>{stats.wifi}</Badge>
          </div>
        </Card>
        <Card>
          <div className="text-sm opacity-70">Data Rate</div>
          <div className="mt-1 text-xl font-semibold">{stats.dataRate}</div>
        </Card>
        <Card>
          <div className="text-sm opacity-70">Error Rate</div>
          <div className="mt-1 text-xl font-semibold">{stats.errorRate}</div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Signal Strength</div>
          <div className="flex gap-2">
            {transmissionStatus === 'idle' ? (
              <Button onClick={startTransmission}>Start Transmission</Button>
            ) : (
              <Button variant="outline" onClick={stopTransmission}>Stop Transmission</Button>
            )}
          </div>
        </div>
        <div className="w-full h-64">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="t" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#6E59F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}


