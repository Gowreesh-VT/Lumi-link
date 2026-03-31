'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, AlertCircle, Activity, Trash2, FileText, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/store/useStore';
import { generateSignalData, exportToCSV } from '@/lib/mockData';
import { getSocket } from '@/lib/socket';
import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const HEX_ERROR_RE = /\[([0-9A-Fa-f]{1,2})\]/;

function TypewriterText({ text, instant }: { text: string; instant?: boolean }) {
  const [displayed, setDisplayed] = useState(instant ? text : '');
  const idxRef = useRef(instant ? text.length : 0);

  useEffect(() => {
    if (instant) { setDisplayed(text); return; }
    idxRef.current = 0;
    setDisplayed('');
    const id = setInterval(() => {
      idxRef.current += 1;
      setDisplayed(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, [text, instant]);

  const done = displayed.length >= text.length;
  return (
    <span className="font-mono text-sm break-all">
      {displayed}
      {!done && <span className="animate-pulse text-primary">▌</span>}
    </span>
  );
}

interface FeedMessage {
  id: string;
  content: string;
  timestamp: string;
  instant: boolean;
}

interface ReceivedFile {
  id: string;
  name: string;
  lines: string[];
  binary: boolean; 
  complete: boolean;
  receivedAt: string;
}

// Use unanchored regex to extract filename even if there is physical signal noise prepended
const FILE_START_RE = /__LIFI_FILE_START__:([^\s]+)/;
const FILE_START_B64_RE = /__LIFI_FILE_START_B64__:([^\s]+)/;
const FILE_END = '__LIFI_FILE_END__';

interface ErrorEntry {
  id: string;
  type: string;
  timestamp: string;
  details: string;
}

export default function ReceiverPage() {
  const systemStatus = useStore((s) => s.systemStatus);
  const messages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const clearMessages = useStore((s) => s.clearMessages);
  const updateSystemStatus = useStore((s) => s.updateSystemStatus);

  const [signalData, setSignalData] = useState(generateSignalData(30));
  const [isRevealed, setIsRevealed] = useState(false);
  const [errorLog, setErrorLog] = useState<ErrorEntry[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [feedMessages, setFeedMessages] = useState<FeedMessage[]>(() => {
    const valid: FeedMessage[] = [];
    let inData = false;
    for (const m of useStore.getState().messages) {
      if (m.direction !== 'received') continue;
      const isStart = FILE_START_RE.test(m.content) || FILE_START_B64_RE.test(m.content);
      if (isStart) inData = true;
      else if (m.content.includes(FILE_END) || m.content.includes('__LIFI_FILE_END_')) inData = false;
      else if (!inData) {
        valid.push({
          id: m.id || Math.random().toString(36).slice(2, 9),
          content: m.content,
          timestamp: m.timestamp || new Date().toISOString(),
          instant: true,
        });
      }
    }
    return valid;
  });

  const inLiveFileRef = useRef(false);

  const receivedFiles = useMemo(() => {
    const files: ReceivedFile[] = [];
    let currentFile: ReceivedFile | null = null;
    for (const msg of messages) {
      if (msg.direction !== 'received') continue;
      const text = msg.content;
      const startMatch = FILE_START_RE.exec(text);
      const startB64Match = FILE_START_B64_RE.exec(text);

      if (startMatch || startB64Match) {
        currentFile = {
          id: msg.id,
          name: (startMatch ?? startB64Match)![1],
          lines: [],
          binary: !!startB64Match,
          complete: false,
          receivedAt: msg.timestamp,
        };
        continue;
      }

      if (text.includes(FILE_END) || text.includes('__LIFI_FILE_END_')) {
        if (currentFile) {
          currentFile.complete = true;
          files.push(currentFile);
          currentFile = null;
        }
        continue;
      }
      if (currentFile) currentFile.lines.push(text);
    }
    return files.filter(f => f.complete);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [feedMessages]);

  useEffect(() => {
    fetch('/api/messages?direction=received', { cache: 'no-store' })
      .then((r) => r.json())
      .then(({ messages: existing }) => {
        if (!Array.isArray(existing)) return;
        const currentIds = new Set(useStore.getState().messages.map(m => m.id));
        existing.forEach((m: { id?: string; content: string; timestamp?: string; status: 'success' | 'error' | 'pending' }) => {
          if (m.id && currentIds.has(m.id)) return;
          addMessage({ content: m.content, direction: 'received', status: m.status });
          setFeedMessages((prev) => [
            ...prev,
            {
              id: m.id ?? Math.random().toString(36).slice(2, 9),
              content: m.content,
              timestamp: m.timestamp ?? new Date().toISOString(),
              instant: true,
            },
          ]);
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('received_message', (data: { message: string; timestamp: string }) => {
      const text = data.message;

      if (HEX_ERROR_RE.test(text)) {
        setErrorLog((prev) => [
          ...prev.slice(-49),
          {
            id: Math.random().toString(36).slice(2, 9),
            type: 'Manchester Decode Error',
            timestamp: new Date().toISOString(),
            details: `Received invalid byte token: ${text}`,
          },
        ]);
      }

      addMessage({ content: text, direction: 'received', status: 'success' });

      const isStart = FILE_START_RE.test(text) || FILE_START_B64_RE.test(text);
      if (isStart) {
        inLiveFileRef.current = true;
        return;
      }
      if (text.includes(FILE_END) || text.includes('__LIFI_FILE_END_')) {
        inLiveFileRef.current = false;
        return;
      }
      if (inLiveFileRef.current) return;

      setFeedMessages((prev) => [
        ...prev.slice(-99), 
        {
          id: Math.random().toString(36).slice(2, 9),
          content: text,
          timestamp: data.timestamp ?? new Date().toISOString(),
          instant: false,
        },
      ]);

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

  const handleClear = () => {
    clearMessages();
    setFeedMessages([]);
  };

  const MIME_MAP: Record<string, string> = {
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    aac: 'audio/aac', flac: 'audio/flac', mp4: 'video/mp4',
  };

  const handleDownloadFile = (file: ReceivedFile) => {
    let blob: Blob;
    if (file.binary) {
      const b64 = file.lines.join('');
      const raw = atob(b64);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const mime = MIME_MAP[ext] ?? 'application/octet-stream';
      blob = new Blob([bytes], { type: mime });
    } else {
      blob = new Blob([file.lines.join('\n')], { type: 'text/plain' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <Button
            onClick={() => setIsRevealed((v) => !v)}
            variant={isRevealed ? 'secondary' : 'default'}
            className="gap-2"
          >
            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isRevealed ? 'Hide Data' : 'Reveal Data'}
            {!isRevealed && feedMessages.length > 0 && (
              <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs font-semibold">
                {feedMessages.length}
              </span>
            )}
          </Button>
          <Button onClick={handleExport} variant="outline" className="gap-2" disabled={feedMessages.length === 0 || !isRevealed}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={handleClear} variant="ghost" size="icon" title="Clear all messages">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {socketConnected && !systemStatus.rxConnected && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          RX serial port not open — close Arduino IDE&apos;s Serial Monitor, then the server will reconnect automatically.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Live Data Feed
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {feedMessages.length} message{feedMessages.length !== 1 ? 's' : ''} received
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isRevealed ? (
                <div className="flex flex-col items-center justify-center h-[360px] gap-4 text-muted-foreground">
                  <EyeOff className="h-10 w-10 opacity-30" />
                  {feedMessages.length > 0 ? (
                    <>
                      <p className="text-sm font-medium">{feedMessages.length} message{feedMessages.length !== 1 ? 's' : ''} received</p>
                      <p className="text-xs">Click &ldquo;Reveal Data&rdquo; to show</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm">Waiting for incoming data...</p>
                      {!socketConnected && (
                        <p className="text-xs text-destructive">Server not connected — start the backend with <code>npm run dev</code></p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-[360px] pr-4">

                  <div ref={scrollRef} className="h-full overflow-auto">
                    {feedMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground pt-12">
                        <Activity className="h-8 w-8 opacity-40" />
                        <p className="text-sm">Waiting for incoming data...</p>
                        {!socketConnected && (
                          <p className="text-xs text-destructive">Server not connected — start the backend with <code>npm run dev</code></p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {feedMessages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 rounded-lg bg-secondary/50 border border-border/50"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <TypewriterText text={msg.content} instant={msg.instant} />
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
              )}
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

        <div className="space-y-6">

          {receivedFiles.length > 0 && isRevealed && (
            <Card className="glass-card shadow-card border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" /> Received Files
                  <span className="ml-auto text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {receivedFiles.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {receivedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.lines.length} line{file.lines.length !== 1 ? 's' : ''} · {new Date(file.receivedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1.5 shrink-0 ml-2" onClick={() => handleDownloadFile(file)}>
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

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
