import { useMemo, useState } from 'react';
import { Card, Button, Select } from '../components/ui';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { generateSeries, toCsv } from '../utils/generate';

type Range = '1h' | '24h' | '7d';

export default function Analytics() {
  const [range, setRange] = useState<Range>('1h');
  const length = range === '1h' ? 60 : range === '24h' ? 24 : 7;

  const speed = useMemo(() => generateSeries(length, 60, 10).map((r) => ({ t: r.t, value: r.value })), [length]);
  const loss = useMemo(() => generateSeries(length, 5, 2).map((r) => ({ t: r.t, value: Math.max(0, Math.min(20, r.value / 3)) })), [length]);
  const light = useMemo(() => generateSeries(length, 50, 12), [length]);

  const exportCsv = () => {
    const rows = speed.map((r, i) => ({
      index: i,
      speedMbps: r.value,
      packetLossPct: loss[i]?.value ?? 0,
      lightIntensity: light[i]?.value ?? 0,
    }));
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'analytics.csv';
    a.click();
  };

  const exportPdf = () => {
    alert('PDF export simulated. Use your browser print to PDF for demo.');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm">Time range</label>
        <Select value={range} onChange={(e) => setRange(e.target.value as Range)}>
          <option value="1h">Last hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
        </Select>
        <Button onClick={exportCsv}>Export CSV</Button>
        <Button variant="outline" onClick={exportPdf}>Export PDF</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <div className="font-semibold mb-2">Transmission Speed</div>
          <div className="w-full h-56">
            <ResponsiveContainer>
              <LineChart data={speed}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="t" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#6E59F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="font-semibold mb-2">Packet Loss</div>
          <div className="w-full h-56">
            <ResponsiveContainer>
              <AreaChart data={loss}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="t" />
                <YAxis />
                <Tooltip />
                <Area dataKey="value" stroke="#F59E0B" fill="#F59E0B33" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="font-semibold mb-2">Light Intensity</div>
          <div className="w-full h-56">
            <ResponsiveContainer>
              <AreaChart data={light}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="t" />
                <YAxis />
                <Tooltip />
                <Area dataKey="value" stroke="#10B981" fill="#10B98133" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}


