import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Lightbulb, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const Transmitter = () => {
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const systemStatus = useStore((state) => state.systemStatus);
  const updateSystemStatus = useStore((state) => state.updateSystemStatus);
  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage);
  const { toast } = useToast();

  const handleLedToggle = () => {
    updateSystemStatus({ ledStatus: !systemStatus.ledStatus });
    toast({
      title: systemStatus.ledStatus ? 'LED Off' : 'LED On',
      description: `Transmitter LED has been turned ${
        !systemStatus.ledStatus ? 'on' : 'off'
      }`,
    });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message to send',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    setProgress(0);

    // Simulate message transmission with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    setTimeout(() => {
      addMessage({
        content: message,
        direction: 'sent',
        status: 'success',
      });

      toast({
        title: 'Message Sent',
        description: 'Your message has been transmitted successfully',
      });

      setMessage('');
      setProgress(0);
      setIsSending(false);
    }, 1200);
  };

  const sentMessages = messages.filter((m) => m.direction === 'sent');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold">Transmitter Control</h1>
        <p className="text-muted-foreground">
          Send messages and control the Li-Fi transmitter
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Message Transmission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <div className="flex gap-2">
                  <Input
                    id="message"
                    placeholder="Enter your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isSending) {
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || !message.trim()}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>

              {isSending && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Transmission Progress
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </motion.div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Message will be encoded and transmitted via Li-Fi LED modulation
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Transmission Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {sentMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No messages sent yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div
                          className={`mt-1 h-2 w-2 rounded-full ${
                            msg.status === 'success'
                              ? 'bg-success'
                              : 'bg-destructive'
                          }`}
                        />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{msg.content}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
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
                <Lightbulb className="h-5 w-5 text-primary" />
                LED Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="led-toggle">LED Status</Label>
                <Switch
                  id="led-toggle"
                  checked={systemStatus.ledStatus}
                  onCheckedChange={handleLedToggle}
                />
              </div>

              <div
                className={`relative h-32 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  systemStatus.ledStatus
                    ? 'bg-primary/20 shadow-glow'
                    : 'bg-muted'
                }`}
              >
                <Lightbulb
                  className={`h-16 w-16 transition-all duration-300 ${
                    systemStatus.ledStatus
                      ? 'text-primary animate-pulse-slow'
                      : 'text-muted-foreground'
                  }`}
                />
              </div>

              <div className="space-y-2 pt-4 border-t text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">
                    {systemStatus.ledStatus ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Intensity</span>
                  <span className="font-medium">
                    {systemStatus.ledStatus ? '100%' : '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modulation</span>
                  <span className="font-medium">
                    {systemStatus.ledStatus ? 'Active' : 'Idle'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Messages Sent</span>
                <span className="font-medium">{sentMessages.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium text-success">
                  {sentMessages.length > 0
                    ? Math.round(
                        (sentMessages.filter((m) => m.status === 'success')
                          .length /
                          sentMessages.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg. Response</span>
                <span className="font-medium">1.2s</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Transmitter;
