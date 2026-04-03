'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Lightbulb, History, Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/store/useStore';
import { getSocket } from '@/lib/socket';
import { toast } from 'sonner';

export default function TransmitterPage() {
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const [pendingFile, setPendingFile] = useState<{ name: string; lines: string[]; binary: boolean } | null>(null);
  const [fileProgress, setFileProgress] = useState(0); 
  const [isSendingFile, setIsSendingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const B64_CHUNK = 60; 

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingIdRef = useRef<string | null>(null);

  const systemStatus = useStore((s) => s.systemStatus);
  const updateSystemStatus = useStore((s) => s.updateSystemStatus);
  const isTransmitting = useStore((s) => s.isTransmitting);
  const setIsTransmitting = useStore((s) => s.setIsTransmitting);
  const messages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const updateMessageStatus = useStore((s) => s.updateMessageStatus);
  const pushSimulationMessage = useStore((s) => s.pushSimulationMessage);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('transmit_ack', (data: { success: boolean; error?: string }) => {

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setIsSending(false);
      setProgress(100);

      if (data.success) {
        toast.success('Transmitted', { description: 'Message sent over Li-Fi' });
        if (pendingIdRef.current) {
          updateMessageStatus(pendingIdRef.current, 'success');
        }
      } else {
        toast.error('Transmission failed', { description: data.error ?? 'Unknown error' });
        if (pendingIdRef.current) {
          updateMessageStatus(pendingIdRef.current, 'error');
        }
      }

      pendingIdRef.current = null;
      setTimeout(() => setProgress(0), 800);
    });

    socket.on('system_status', (data: { lifiConnected: boolean; txConnected: boolean; rxConnected: boolean }) => {
      updateSystemStatus({
        lifiConnected: data.lifiConnected,
        txConnected: data.txConnected,
        rxConnected: data.rxConnected,
      });
    });

    if (socket.connected) setSocketConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('transmit_ack');
      socket.off('system_status');
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [updateSystemStatus, updateMessageStatus]);

  const handleTransmissionToggle = () => {
    const next = !isTransmitting;
    setIsTransmitting(next);
    const socket = getSocket();
    socket.emit(next ? 'start_transmission' : 'stop_transmission');
    toast(next ? 'Transmission started' : 'Transmission stopped', {
      description: next ? 'ESP32 transmitter is now active' : 'ESP32 transmitter has been paused',
    });
  };

  const handleLedToggle = () => {
    updateSystemStatus({ ledStatus: !systemStatus.ledStatus });
    toast(systemStatus.ledStatus ? 'LED Off' : 'LED On', {
      description: `Transmitter LED turned ${!systemStatus.ledStatus ? 'on' : 'off'}`,
    });
  };

  const BINARY_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'video/mp4', 'application/octet-stream'];
  const isBinaryFile = (f: File) => BINARY_TYPES.includes(f.type) || /\.(mp3|wav|ogg|mp4|aac|flac)$/i.test(f.name);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const binary = isBinaryFile(file);
    const maxSize = binary ? 512 * 1024 : 10 * 1024; 
    if (file.size > maxSize) {
      toast.error('File too large', { description: `Max ${binary ? '512 KB' : '10 KB'} for this file type.` });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    if (binary) {
      reader.onload = (ev) => {
        const buf = ev.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(buf);

        let b64 = '';
        bytes.forEach((b) => { b64 += String.fromCharCode(b); });
        const encoded = btoa(b64);

        const lines: string[] = [];
        for (let i = 0; i < encoded.length; i += B64_CHUNK) {
          lines.push(encoded.slice(i, i + B64_CHUNK));
        }
        if (lines.length === 0) { toast.error('Empty file'); return; }
        setPendingFile({ name: file.name, lines, binary: true });
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (ev) => {
        const text = (ev.target?.result as string) ?? '';
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) { toast.error('Empty file'); return; }
        setPendingFile({ name: file.name, lines, binary: false });
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleSendFile = async () => {
    if (!pendingFile) return;
    const socket = getSocket();
    setIsSendingFile(true);
    setFileProgress(0);
    const { name, lines } = pendingFile;

    const sendLine = (text: string, idx: number) =>
      new Promise<void>((resolve) => {
        const onAck = (data: { success: boolean; error?: string }) => {
          socket.off('transmit_ack', onAck);
          if (!data.success) toast.error(`Line ${idx + 1} failed`, { description: data.error });
          resolve();
        };
        socket.on('transmit_ack', onAck);
        socket.emit('send_message', { message: text });
      });

    const startMarker = pendingFile.binary
      ? `__LIFI_FILE_START_B64__:${name}`
      : `__LIFI_FILE_START__:${name}`;
    await sendLine(startMarker, -1);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (!pendingFile.binary) addMessage({ content: line, direction: 'sent', status: 'pending' });
      await sendLine(line, i);
      setFileProgress(Math.round(((i + 1) / lines.length) * 100));
    }

    await sendLine('__LIFI_FILE_END__', -1);

    toast.success('File transmitted', { description: `${name} — ${lines.length} chunk(s) sent` });
    setIsSendingFile(false);
    setFileProgress(0);
    setPendingFile(null);
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    setProgress(10);

    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 15 : p));
    }, 200);

    const socket = getSocket();
    const trimmed = message.trim();

    addMessage({ content: trimmed, direction: 'sent', status: 'pending' });

    const msgs = useStore.getState().messages;
    const latest = msgs[msgs.length - 1];
    pendingIdRef.current = latest?.id ?? null;

    if (socketConnected) {
      socket.emit('send_message', { message: trimmed });
    } else {
      setTimeout(() => {
        pushSimulationMessage(trimmed);
      }, 900);

      setTimeout(() => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setIsSending(false);
        setProgress(100);
        if (pendingIdRef.current) {
          updateMessageStatus(pendingIdRef.current, 'success');
        }
        pendingIdRef.current = null;
        setTimeout(() => setProgress(0), 800);
        toast.success('Transmitted (simulation)', { description: 'Message queued for receiver' });
      }, 950);
    }

    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSending) handleSend();
  };

  const sentMessages = messages.filter((m) => m.direction === 'sent');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transmitter</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            Send data via Li-Fi
            <span className={`inline-block h-2 w-2 rounded-full ${socketConnected ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
            <span className="text-xs">{socketConnected ? 'Server connected' : 'Server disconnected'}</span>
          </p>
        </div>
        <Button
          onClick={handleTransmissionToggle}
          size="sm"
          variant={isTransmitting ? 'destructive' : 'default'}
          className="gap-2"
        >
          {isTransmitting ? 'Stop Transmission' : 'Start Transmission'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" /> Compose Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <div className="flex gap-2">
                  <Input
                    id="message"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending || isSendingFile}
                  />
                  <Button onClick={handleSend} disabled={isSending || isSendingFile || !message.trim()} className="gap-2 shrink-0">
                    <Send className="h-4 w-4" />
                    {isSending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>

              {(isSending || progress > 0) && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{isSending ? 'Transmitting over Li-Fi...' : 'Transmitted!'}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" />
                <span>or send a file</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv,.log,.mp3,.wav,.ogg,.aac,.flac,.mp4"
                className="hidden"
                onChange={handleFileChange}
              />
              {!pendingFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending || isSendingFile}
                  className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm font-medium">Click to upload a file</span>
                  <span className="text-xs">Text (.txt .md .csv) · Audio (.mp3 .wav .ogg) · Max 512 KB</span>
                </button>
              ) : (
                <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-primary" />
                      {pendingFile.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingFile(null)}
                      disabled={isSendingFile}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{pendingFile.lines.length} line(s) to transmit</p>
                  {isSendingFile && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Transmitting file...</span>
                        <span>{fileProgress}%</span>
                      </div>
                      <Progress value={fileProgress} />
                    </div>
                  )}
                  <Button
                    onClick={handleSendFile}
                    disabled={isSendingFile || isSending}
                    className="w-full gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSendingFile ? `Sending line ${Math.round((fileProgress / 100) * pendingFile.lines.length)} / ${pendingFile.lines.length}...` : 'Send File over Li-Fi'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Sent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {sentMessages.length === 0 ? (
                  <p className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No messages sent yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[...sentMessages].reverse().map((msg) => (
                      <div key={msg.id} className="flex items-start justify-between p-3 rounded-lg bg-secondary/50">
                        <div>
                          <p className="font-medium text-sm">{msg.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          msg.status === 'success' ? 'bg-success/20 text-success'
                            : msg.status === 'error' ? 'bg-destructive/20 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" /> LED Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Transmitter LED</Label>
                <Switch checked={systemStatus.ledStatus} onCheckedChange={handleLedToggle} />
              </div>
              <div className={`h-24 rounded-lg flex items-center justify-center transition-all duration-500 ${systemStatus.ledStatus ? 'bg-yellow-400/20 shadow-glow' : 'bg-muted'}`}>
                <Lightbulb className={`h-12 w-12 transition-colors duration-500 ${systemStatus.ledStatus ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">Connection Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Server</span>
                <span className={socketConnected ? 'text-success' : 'text-destructive'}>
                  {socketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Li-Fi Link</span>
                <span className={systemStatus.lifiConnected ? 'text-success' : 'text-destructive'}>
                  {systemStatus.lifiConnected ? 'Active' : 'No hardware'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TX Port</span>
                <span className={systemStatus.txConnected ? 'text-success' : 'text-muted-foreground'}>
                  {systemStatus.txConnected ? 'Open' : 'Not connected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">RX Port</span>
                <span className={systemStatus.rxConnected ? 'text-success' : 'text-muted-foreground'}>
                  {systemStatus.rxConnected ? 'Open' : 'Not connected'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
