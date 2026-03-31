'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateSignalData, exportToCSV } from '@/lib/mockData';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const timeRanges = ['1 Hour', '24 Hours', '7 Days'] as const;
type Range = typeof timeRanges[number];

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('24 Hours');

  const data = useMemo(() => {
    const points = range === '1 Hour' ? 60 : range === '24 Hours' ? 24 : 7;
    return generateSignalData(points);
  }, [range]);

  const handleExport = () =>
    exportToCSV(
      data.map((d) => ({
        timestamp: d.timestamp.toISOString(),
        signalStrength: d.signalStrength.toFixed(2),
        dataRate: d.dataRate.toFixed(2),
        errorRate: d.errorRate.toFixed(4),
      })),
      `analytics-${range.replace(' ', '-').toLowerCase()}-${Date.now()}.csv`
    );

  const avgSignal = (data.reduce((s, d) => s + d.signalStrength, 0) / data.length).toFixed(1);
  const avgRate   = (data.reduce((s, d) => s + d.dataRate, 0) / data.length).toFixed(1);
  const avgError  = ((data.reduce((s, d) => s + d.errorRate, 0) / data.length) * 100).toFixed(2);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Historical performance data</p>
        </div>
        <div className="flex items-center gap-2">
          {timeRanges.map((r) => (
            <Button key={r} variant={range === r ? 'default' : 'outline'} size="sm" onClick={() => setRange(r)}>
              {r}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Avg Signal Strength', value: `${avgSignal}%` },
          { label: 'Avg Data Rate',       value: `${avgRate} Mbps` },
          { label: 'Avg Error Rate',      value: `${avgError}%` },
        ].map((card) => (
          <Card key={card.label} className="glass-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Throughput &amp; Signal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString()} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <Tooltip labelFormatter={(v) => new Date(v).toLocaleTimeString()} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Line type="monotone" dataKey="signalStrength" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Signal (%)" />
              <Line type="monotone" dataKey="dataRate" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Data Rate (Mbps)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle>Error Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.slice(-20)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString()} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <Tooltip labelFormatter={(v) => new Date(v).toLocaleTimeString()} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="errorRate" fill="hsl(var(--destructive))" name="Error Rate" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
