import { useEffect, useState } from 'react';
import { Card, Button } from '../components/ui';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { getSocket } from '../lib/socket';
import { toCsv } from '../utils/generate';

export default function Receiver() {
  const { messages, addMessage } = useAppStore();
  const [intensity, setIntensity] = useState<{ t: number; value: number }[]>([]);
  const [errors, setErrors] = useState<{ t: number; type: string }[]>([]);

  useEffect(() => {
    const s = getSocket();
    s.on('message', (payload: any) => {
      addMessage({ id: crypto.randomUUID(), deviceId: payload.deviceId ?? 'esp32', message: payload.message ?? String(payload), timestamp: Date.now() });
      setIntensity((d) => [...d.slice(-59), { t: (d.at(-1)?.t ?? 0) + 1, value: 40 + Math.random() * 20 }]);
      if (Math.random() < 0.05) setErrors((e) => [{ t: Date.now(), type: 'checksum' }, ...e].slice(0, 50));
    });
    return () => {
      s.off('message');
    };
  }, [addMessage]);

  const download = () => {
    const rows = intensity.map((r) => ({ time: r.t, intensity: r.value }));
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'receiver_data.csv';
    a.click();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Live Data Feed</div>
          <Button variant="outline" onClick={download}>Download CSV</Button>
        </div>
        <div className="space-y-2 max-h-80 overflow-auto">
          {messages.map((m) => (
            <div key={m.id} className="text-sm">
              {new Date(m.timestamp).toLocaleTimeString()} — [{m.deviceId}] {m.message}
            </div>
          ))}
          {messages.length === 0 && <div className="opacity-60 text-sm">No messages yet.</div>}
        </div>
      </Card>
      <Card>
        <div className="font-semibold mb-2">Received Signal Intensity</div>
        <div className="w-full h-64">
          <ResponsiveContainer>
            <LineChart data={intensity}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="t" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#34D399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-sm opacity-70">Error log: {errors.length} events (simulated)</div>
      </Card>
    </div>
  );
}


