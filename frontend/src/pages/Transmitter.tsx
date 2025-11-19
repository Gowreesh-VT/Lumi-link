import { useState } from 'react';
import { Button, Card, Input, Textarea, Progress, Badge } from '../components/ui';
import { useAppStore } from '../store/useAppStore';

export default function Transmitter() {
  const { ledOn, toggleLed, addMessage } = useAppStore();
  const [message, setMessage] = useState('Hello from Li-Fi!');
  const [deviceId, setDeviceId] = useState('esp32-01');
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<{ t: number; text: string }[]>([]);

  const send = async () => {
    setProgress(0);
    setLog((l) => [{ t: Date.now(), text: `Sending to ${deviceId}...` }, ...l]);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 80));
      setProgress(i);
    }
    const payload = { message, deviceId };
    try {
      await fetch((import.meta as any).env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api/send` : 'http://localhost:4000/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      addMessage({ id: crypto.randomUUID(), deviceId, message, timestamp: Date.now() });
      setLog((l) => [{ t: Date.now(), text: 'Message sent.' }, ...l]);
    } catch (e) {
      setLog((l) => [{ t: Date.now(), text: 'Send failed (mock).' }, ...l]);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <div className="font-semibold mb-2">Transmitter Control</div>
        <div className="grid gap-2">
          <label className="text-sm">Device ID</label>
          <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
          <label className="text-sm">Message</label>
          <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="flex items-center gap-2 mt-2">
            <Button onClick={send}>Send</Button>
            <Button variant="outline" onClick={toggleLed}>{ledOn ? 'LED OFF' : 'LED ON'}</Button>
            <Badge color={ledOn ? 'green' : 'gray'}>{ledOn ? 'LED: ON' : 'LED: OFF'}</Badge>
          </div>
          <div className="mt-3">
            <Progress value={progress} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="font-semibold mb-2">Transmission Log</div>
        <div className="space-y-2 max-h-80 overflow-auto">
          {log.map((item) => (
            <div key={item.t} className="text-sm opacity-80">
              {new Date(item.t).toLocaleTimeString()} — {item.text}
            </div>
          ))}
          {log.length === 0 && <div className="text-sm opacity-60">No transmissions yet.</div>}
        </div>
      </Card>
    </div>
  );
}


