'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Lightbulb, History } from 'lucide-react';
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
  // Keep a ref so we can clear the progress interval inside the ack handler
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track the pending message id so we can update its status on ack
  const pendingIdRef = useRef<string | null>(null);

  const systemStatus = useStore((s) => s.systemStatus);
  const updateSystemStatus = useStore((s) => s.updateSystemStatus);
  const isTransmitting = useStore((s) => s.isTransmitting);
  const setIsTransmitting = useStore((s) => s.setIsTransmitting);
  const messages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const updateMessageStatus = useStore((s) => s.updateMessageStatus);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Ack from server after write to TX serial port
    socket.on('transmit_ack', (data: { success: boolean; error?: string }) => {
      // Stop the progress animation now that we have the ack
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

    // Real-time connection status from server
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

  // Wire the Start/Stop Transmission toggle to the server
  const handleTransmissionToggle = () => {
    const next = !isTransmitting;
    setIsTransmitting(next);
    const socket = getSocket();
    socket.emit(next ? 'start_transmission' : 'stop_transmission');
    toast(next ? 'Transmission started' : 'Transmission stopped', {
      description: next ? 'ESP32 transmitter is now active' : 'ESP32 transmitter has been paused',
    });
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleLedToggle = () => {
    updateSystemStatus({ ledStatus: !systemStatus.ledStatus });
    toast(systemStatus.ledStatus ? 'LED Off' : 'LED On', {
      description: `Transmitter LED turned ${!systemStatus.ledStatus ? 'on' : 'off'}`,
    });
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    setProgress(10);

    // Animate progress bar — will be cleared inside transmit_ack handler
    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 15 : p));
    }, 200);

    // Add to local message history optimistically and capture the generated id
    // addMessage prepends with a random id; we retrieve it from the store after
    const socket = getSocket();
    const trimmed = message.trim();

    addMessage({ content: trimmed, direction: 'sent', status: 'pending' });

    // The addMessage call is synchronous in Zustand — grab the newest message's id
    const msgs = useStore.getState().messages;
    const latest = msgs[msgs.length - 1];
    pendingIdRef.current = latest?.id ?? null;

    socket.emit('send_message', { message: trimmed });
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSending) handleSend();
  };

  const sentMessages = messages.filter((m) => m.direction === 'sent');

  // ── UI ────────────────────────────────────────────────────────────────────
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
        {/* Compose + send */}
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
                    disabled={isSending}
                  />
                  <Button onClick={handleSend} disabled={isSending || !message.trim()} className="gap-2 shrink-0">
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
            </CardContent>
          </Card>

          {/* Sent history */}
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

        {/* Controls */}
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
