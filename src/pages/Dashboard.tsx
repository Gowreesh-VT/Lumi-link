import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Wifi,
  Zap,
  AlertTriangle,
  Play,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { useStore } from '@/store/useStore';
import { generateSignalData } from '@/lib/mockData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const systemStatus = useStore((state) => state.systemStatus);
  const isTransmitting = useStore((state) => state.isTransmitting);
  const setIsTransmitting = useStore((state) => state.setIsTransmitting);
  const [signalData, setSignalData] = useState(generateSignalData(30));

  useEffect(() => {
    const interval = setInterval(() => {
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

    return () => clearInterval(interval);
  }, []);

  const handleTransmissionToggle = () => {
    setIsTransmitting(!isTransmitting);
  };

  const statusCards = [
    {
      title: 'Li-Fi Connection',
      value: systemStatus.lifiConnected ? 'Connected' : 'Disconnected',
      icon: Zap,
      status: systemStatus.lifiConnected,
      gradient: 'gradient-primary',
    },
    {
      title: 'Wi-Fi Status',
      value: systemStatus.wifiConnected ? 'Online' : 'Offline',
      icon: Wifi,
      status: systemStatus.wifiConnected,
      gradient: 'gradient-success',
    },
    {
      title: 'Data Rate',
      value: `${systemStatus.dataRate.toFixed(1)} Mbps`,
      icon: Activity,
      status: true,
      gradient: 'gradient-card',
    },
    {
      title: 'Error Rate',
      value: `${(systemStatus.errorRate * 100).toFixed(2)}%`,
      icon: AlertTriangle,
      status: systemStatus.errorRate < 0.05,
      gradient: 'gradient-card',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and control
          </p>
        </div>

        <Button
          onClick={handleTransmissionToggle}
          size="lg"
          variant={isTransmitting ? 'destructive' : 'default'}
          className="gap-2"
        >
          {isTransmitting ? (
            <>
              <Square className="h-4 w-4" />
              Stop Transmission
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Transmission
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.gradient}`}>
                  <card.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="mt-2">
                  <StatusBadge
                    status={card.status ? 'active' : 'inactive'}
                    label={card.status ? 'Active' : 'Inactive'}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle>Signal Strength Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={signalData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
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
                dataKey="signalStrength"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Signal Strength (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card shadow-card">
          <CardHeader>
            <CardTitle>Current Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Signal Strength
              </span>
              <span className="text-sm font-medium">
                {systemStatus.signalStrength}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                LED Status
              </span>
              <StatusBadge
                status={systemStatus.ledStatus ? 'active' : 'inactive'}
                label={systemStatus.ledStatus ? 'ON' : 'OFF'}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Transmission Mode
              </span>
              <StatusBadge
                status={isTransmitting ? 'active' : 'inactive'}
                label={isTransmitting ? 'Active' : 'Idle'}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-card">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">CPU Usage</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: '45%' }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Memory Usage</span>
                <span className="font-medium">62%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: '62%' }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium">5h 23m</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default Dashboard;
