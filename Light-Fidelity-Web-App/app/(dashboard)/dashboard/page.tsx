'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, Zap, AlertTriangle, Play, Square, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { useStore } from '@/store/useStore';
import { generateSignalData } from '@/lib/mockData';
import { getSocket } from '@/lib/socket';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const systemStatus = useStore((s) => s.systemStatus);
  const updateSystemStatus = useStore((s) => s.updateSystemStatus);
  const isTransmitting = useStore((s) => s.isTransmitting);
  const setIsTransmitting = useStore((s) => s.setIsTransmitting);
  const [signalData, setSignalData] = useState(generateSignalData(30));

  // Connect to server and listen for status updates
  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    socket.on('system_status', (data: { lifiConnected: boolean; txConnected: boolean; rxConnected: boolean }) => {
      updateSystemStatus({
        lifiConnected: data.lifiConnected,
        txConnected: data.txConnected,
        rxConnected: data.rxConnected,
      });
    });

    // Rolling signal chart updates
    const interval = setInterval(() => {
      setSignalData((prev) => {
        const last = prev[prev.length - 1];
        return [
          ...prev.slice(1),
          {
            timestamp: new Date(),
            signalStrength: Math.max(60, Math.min(95, last.signalStrength + (Math.random() - 0.5) * 5)),
            dataRate: Math.max(5, Math.min(15, last.dataRate + (Math.random() - 0.5) * 2)),
            errorRate: Math.random() * 0.05,
          },
        ];
      });
    }, 2000);

    return () => {
      socket.off('system_status');
      clearInterval(interval);
    };
  }, [updateSystemStatus]);

  const handleTransmissionToggle = () => {
    const next = !isTransmitting;
    setIsTransmitting(next);
    const socket = getSocket();
    socket.emit(next ? 'start_transmission' : 'stop_transmission');
  };

  const statusCards = [
    { title: 'Li-Fi Connection', value: systemStatus.lifiConnected ? 'Connected' : 'Disconnected', icon: Zap,           status: systemStatus.lifiConnected },
    { title: 'Wi-Fi Status',     value: systemStatus.wifiConnected ? 'Online' : 'Offline',         icon: Wifi,          status: systemStatus.wifiConnected },
    { title: 'TX Port',          value: systemStatus.txConnected ? 'Open' : 'Not connected',        icon: Radio,         status: systemStatus.txConnected },
    { title: 'Data Rate',        value: `${systemStatus.dataRate.toFixed(1)} Mbps`,                 icon: Activity,      status: true },
    { title: 'Error Rate',       value: `${(systemStatus.errorRate * 100).toFixed(2)}%`,            icon: AlertTriangle, status: systemStatus.errorRate < 0.05 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Dashboard</h1>
          <p className="text-muted-foreground">Real-time monitoring and control</p>
        </div>
        <Button onClick={handleTransmissionToggle} size="lg" variant={isTransmitting ? 'destructive' : 'default'} className="gap-2">
          {isTransmitting ? <><Square className="h-4 w-4" /> Stop Transmission</> : <><Play className="h-4 w-4" /> Start Transmission</>}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statusCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="glass-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <StatusBadge status={card.status ? 'active' : 'inactive'} label={card.status ? 'Operational' : 'Offline'} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Live Signal Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={signalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString()} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(v) => new Date(v).toLocaleTimeString()} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Line type="monotone" dataKey="signalStrength" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Signal Strength (%)" />
              <Line type="monotone" dataKey="dataRate" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Data Rate (Mbps)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
