'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/StatusBadge';
import { useStore } from '@/store/useStore';
import { generateDevices } from '@/lib/mockData';
import { toast } from 'sonner';

const devices = generateDevices();

export default function SettingsPage() {
  const wifiSettings = useStore((s) => s.wifiSettings);
  const updateWifiSettings = useStore((s) => s.updateWifiSettings);
  const [localSettings, setLocalSettings] = useState(wifiSettings);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    updateWifiSettings(localSettings);
    toast.success('Settings saved', { description: 'Wi-Fi configuration updated' });
  };

  const handleTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      toast.success('Connection OK', { description: 'Wi-Fi is working properly' });
    }, 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Network Settings</h1>
        <p className="text-muted-foreground">Configure Wi-Fi and manage connected devices</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" /> Wi-Fi Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ssid">Network SSID</Label>
                  <Input id="ssid" placeholder="Enter network name" value={localSettings.ssid} onChange={(e) => setLocalSettings({ ...localSettings, ssid: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter password" value={localSettings.password} onChange={(e) => setLocalSettings({ ...localSettings, password: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="gap-2"><Check className="h-4 w-4" /> Save</Button>
                <Button onClick={handleTest} variant="outline" disabled={isTesting} className="gap-2">
                  {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-card">
            <CardHeader>
              <CardTitle>Known Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-sm">{device.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{device.ipAddress}</p>
                    </div>
                    <StatusBadge status={device.status === 'online' ? 'online' : 'offline'} label={device.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
