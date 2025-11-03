import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/StatusBadge';
import { generateDevices } from '@/lib/mockData';

const Settings = () => {
  const wifiSettings = useStore((state) => state.wifiSettings);
  const updateWifiSettings = useStore((state) => state.updateWifiSettings);
  const systemStatus = useStore((state) => state.systemStatus);
  const { toast } = useToast();

  const [localSettings, setLocalSettings] = useState(wifiSettings);
  const [isTesting, setIsTesting] = useState(false);
  const [devices] = useState(generateDevices());

  const handleSave = () => {
    updateWifiSettings(localSettings);
    toast({
      title: 'Settings Saved',
      description: 'Wi-Fi configuration has been updated successfully',
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    
    // Simulate connection test
    setTimeout(() => {
      setIsTesting(false);
      toast({
        title: 'Connection Test',
        description: 'Wi-Fi connection is working properly',
      });
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold">Network Settings</h1>
        <p className="text-muted-foreground">
          Configure Wi-Fi and manage connected devices
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" />
                Wi-Fi Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ssid">Network SSID</Label>
                  <Input
                    id="ssid"
                    placeholder="Enter network name"
                    value={localSettings.ssid}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, ssid: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={localSettings.password}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        password: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="gap-2">
                  <Check className="h-4 w-4" />
                  Save Configuration
                </Button>
                <Button
                  onClick={handleTestConnection}
                  variant="outline"
                  disabled={isTesting}
                  className="gap-2"
                >
                  {isTesting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wifi className="h-4 w-4" />
                  )}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {devices.map((device, index) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg glass-card"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.ipAddress}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last seen:{' '}
                        {device.lastSeen.toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge
                      status={device.status === 'online' ? 'online' : 'offline'}
                      label={device.status}
                    />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Wi-Fi Status
                  </span>
                  <StatusBadge
                    status={
                      systemStatus.wifiConnected ? 'online' : 'offline'
                    }
                    label={systemStatus.wifiConnected ? 'Connected' : 'Disconnected'}
                  />
                </div>
                
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
                    Current SSID
                  </span>
                  <span className="text-sm font-medium">
                    {wifiSettings.ssid}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Connection Quality
                    </span>
                    <span className="font-medium">Excellent</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full gradient-success"
                      style={{ width: `${systemStatus.signalStrength}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle>Network Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IP Address</span>
                <span className="font-medium font-mono">192.168.1.100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subnet Mask</span>
                <span className="font-medium font-mono">255.255.255.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gateway</span>
                <span className="font-medium font-mono">192.168.1.1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DNS Server</span>
                <span className="font-medium font-mono">8.8.8.8</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
