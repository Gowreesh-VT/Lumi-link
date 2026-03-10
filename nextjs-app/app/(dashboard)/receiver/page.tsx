'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, AlertCircle, Activity, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/store/useStore';
import { generateSignalData, exportToCSV } from '@/lib/mockData';
import { getSocket } from '@/lib/socket';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// Regex to detect Manchester decode error tokens like [1A], [FF] etc.
const HEX_ERROR_RE = /\[([0-9A-Fa-f]{1,2})\]/;

interface ErrorEntry {
  id: string;
  type: string;
  timestamp: string;
  details: string;
}

export default function ReceiverPage() {
  const messages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const clearMessages = useStore((s) => s.clearMessages);
  const updateSystemStatus = useStore((s) => s.updateSystemStatus);

  const [signalData, setSignalData] = useState(generateSignalData(30));
  const [errorLog, setErrorLog] = useState<ErrorEntry[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll message list to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // ← Messages decoded by the RX ESP32 arrive here
    socket.on('received_message', (data: { message: string; timestamp: string }) => {
      const text = data.message;

      // Detect hex-encoded Manchester decode errors from the ESP32
      if (HEX_ERROR_RE.test(text)) {
        setErrorLog((prev) => [
          ...prev.slice(-49), // keep last 50 errors
          {
            id: Math.random().toString(36).slice(2, 9),
            type: 'Manchester Decode Error',
            timestamp: new Date().toISOString(),
            details: `Received invalid byte token: ${text}`,
          },
        ]);
        // Still record in the main feed so nothing is hidden
      }

      addMessage({ content: text, direction: 'received', status: 'success' });

      // Roll the signal chart forward on every real message
      setSignalData((prev) => {
        const last = prev[prev.length - 1];
        return [
          ...prev.slice(1),
          {
            timestamp: new Date(),
            signalStrength: Math.max(60, Math.min(98, last.signalStrength + (Math.random() - 0.3) * 8)),
            dataRate: Math.max(5, Math.min(15, last.dataRate + (Math.random() - 0.5) * 2)),
            errorRate: Math.random() * 0.03,
          },
        ];
      });
    });

    socket.on('system_status', (data: { lifiConnected: boolean; txConnected: boolean; rxConnected: boolean }) => {
      updateSystemStatus({
        lifiConnected: data.lifiConnected,
        txConnected: data.txConnected,
        rxConnected: data.rxConnected,
      });
    });

    if (socket.connected) setSocketConnected(true);

    // Keep signal chart rolling even without messages
    const signalInterval = setInterval(() => {
      setSignalData((prev) => {
        const last = prev[prev.length - 1];
        return [
          ...prev.slice(1),
          {
            timestamp: new Date(),
            signalStrength: Math.max(40, Math.min(95, last.signalStrength + (Math.random() - 0.5) * 5)),
            dataRate: Math.max(0, Math.min(15, last.dataRate + (Math.random() - 0.5) * 2)),
            errorRate: Math.random() * 0.05,
          },
        ];
      });
    }, 2000);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('received_message');
      socket.off('system_status');
      clearInterval(signalInterval);
    };
  }, [addMessage, updateSystemStatus]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleExport = () => {
    const data = messages
      .filter((m) => m.direction === 'received')
      .map((m) => ({
        timestamp: new Date(m.timestamp).toISOString(),
        message: m.content,
        status: m.status,
      }));
    exportToCSV(data, `lifi-received-${Date.now()}.csv`);
  };

  const receivedMessages = messages.filter((m) => m.direction === 'received');

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Receiver Monitor</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            Incoming decoded messages
            <span className={`inline-block h-2 w-2 rounded-full ${socketConnected ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
            <span className="text-xs">{socketConnected ? 'Server connected' : 'Server disconnected'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2" disabled={receivedMessages.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={clearMessages} variant="ghost" size="icon" title="Clear all messages">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live feed + signal chart */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Live Data Feed
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {receivedMessages.length} message{receivedMessages.length !== 1 ? 's' : ''} received
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[360px] pr-4">
                {/* scrollRef on the inner div to auto-scroll */}
                <div ref={scrollRef} className="h-full overflow-auto">
                  {receivedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground pt-12">
                      <Activity className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Waiting for incoming data...</p>
                      {!socketConnected && (
                        <p className="text-xs text-destructive">Server not connected — start the backend with <code>npm run dev</code></p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {receivedMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 rounded-lg bg-secondary/50 border border-border/50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-mono text-sm break-all">{msg.content}</p>
                            <span className="text-xs text-success shrink-0 bg-success/10 px-2 py-0.5 rounded-full">RX</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle>Signal Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={signalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString()} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleTimeString()} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="signalStrength" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Signal Strength (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Error log */}
        <div>
          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-warning" /> Error Log
                {errorLog.length > 0 && (
                  <span className="ml-auto text-xs font-normal bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                    {errorLog.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[560px] pr-2">
                {errorLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No errors logged</p>
                ) : (
                  <div className="space-y-2">
                    {[...errorLog].reverse().map((err) => (
                      <div key={err.id} className="p-2 rounded bg-destructive/10 border border-destructive/20 text-xs">
                        <p className="font-medium text-destructive">{err.type}</p>
                        <p className="text-muted-foreground">{err.details}</p>
                        <p className="text-muted-foreground/70 mt-1">{new Date(err.timestamp).toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
