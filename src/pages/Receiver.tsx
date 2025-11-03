import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, AlertCircle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/store/useStore';
import { exportToCSV, generateSignalData } from '@/lib/mockData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Receiver = () => {
  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage);
  const [signalData, setSignalData] = useState(generateSignalData(30));
  const [errorLog, setErrorLog] = useState<
    Array<{ id: string; type: string; timestamp: Date; details: string }>
  >([]);

  useEffect(() => {
    // Simulate receiving messages periodically
    const messageInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const sampleMessages = [
          'Status update received',
          'Sensor data: 23.5°C',
          'Connection heartbeat',
          'Configuration sync complete',
        ];
        
        addMessage({
          content: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
          direction: 'received',
          status: 'success',
        });
      }
    }, 5000);

    // Simulate signal data updates
    const signalInterval = setInterval(() => {
      setSignalData((prev) => {
        const newData = [...prev.slice(1)];
        const lastPoint = prev[prev.length - 1];
        const now = new Date();
        
        newData.push({
          timestamp: now,
          signalStrength: Math.max(
            60,
            Math.min(95, lastPoint.signalStrength + (Math.random() - 0.5) * 5)
          ),
          dataRate: Math.max(
            5,
            Math.min(15, lastPoint.dataRate + (Math.random() - 0.5) * 2)
          ),
          errorRate: Math.random() * 0.05,
        });
        
        return newData;
      });
    }, 2000);

    // Simulate occasional errors
    const errorInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        const errorTypes = [
          { type: 'Checksum Error', details: 'Data integrity check failed' },
          { type: 'Missed Bits', details: 'Signal interruption detected' },
          { type: 'Sync Loss', details: 'Temporary synchronization loss' },
        ];
        
        const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        setErrorLog((prev) => [
          {
            id: Math.random().toString(36).substr(2, 9),
            type: error.type,
            timestamp: new Date(),
            details: error.details,
          },
          ...prev.slice(0, 19), // Keep last 20 errors
        ]);
      }
    }, 8000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(signalInterval);
      clearInterval(errorInterval);
    };
  }, [addMessage]);

  const handleExportData = () => {
    const dataToExport = messages
      .filter((m) => m.direction === 'received')
      .map((m) => ({
        timestamp: new Date(m.timestamp).toISOString(),
        message: m.content,
        status: m.status,
      }));

    exportToCSV(dataToExport, `lifi-received-data-${Date.now()}.csv`);
  };

  const receivedMessages = messages.filter((m) => m.direction === 'received');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Receiver Monitor</h1>
          <p className="text-muted-foreground">
            Monitor incoming data and signal quality
          </p>
        </div>

        <Button onClick={handleExportData} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Live Data Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {receivedMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Waiting for incoming data...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivedMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-4 rounded-lg glass-card"
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
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle>Signal Intensity & Bit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={signalData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(time) =>
                      new Date(time).toLocaleTimeString()
                    }
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleTimeString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="dataRate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Data Rate (Mbps)"
                  />
                  <Line
                    type="monotone"
                    dataKey="signalStrength"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    dot={false}
                    name="Signal Strength (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Error Detection Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {errorLog.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No errors detected
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errorLog.map((error) => (
                      <motion.div
                        key={error.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg bg-warning/10 border border-warning/20"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{error.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {error.details}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(error.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle>Reception Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Messages Received
                </span>
                <span className="font-medium">{receivedMessages.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium text-success">
                  {receivedMessages.length > 0
                    ? Math.round(
                        (receivedMessages.filter((m) => m.status === 'success')
                          .length /
                          receivedMessages.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Errors Detected</span>
                <span className="font-medium text-warning">
                  {errorLog.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg. Signal</span>
                <span className="font-medium">
                  {signalData.length > 0
                    ? Math.round(
                        signalData.reduce(
                          (sum, d) => sum + d.signalStrength,
                          0
                        ) / signalData.length
                      )
                    : 0}
                  %
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Receiver;
