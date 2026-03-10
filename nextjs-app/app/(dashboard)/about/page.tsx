'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const teamMembers = [
  { name: 'Gowreesh V T',   role: 'Project Lead & Developer', email: 'vt.gowreesh43@gmail.com',     bio: 'First year Computer Science Engineering Student' },
  { name: 'Anvesha',         role: 'Software Engineer',        email: 'anveshachoudary21@gmail.com', bio: 'First year Computer Science Engineering Student' },
  { name: 'Shruthishree',    role: 'Hardware Engineer',        email: '',                            bio: 'First year Electrical and Electronics Engineering Student' },
  { name: 'Sidharth',        role: 'Hardware Engineer',        email: '',                            bio: 'First year Electrical and Electronics Engineering Student' },
];

export default function AboutPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent!', { description: "We'll get back to you soon." });
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">About the Project</h1>
        <p className="text-muted-foreground">Learn more about the LumiLink communication system</p>
      </div>

      <Card className="glass-card shadow-card">
        <CardHeader><CardTitle>Project Overview</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">LumiLink</strong> is an innovative academic engineering project that combines Light Fidelity (Li-Fi) and traditional Wi-Fi technologies to create a robust, high-speed wireless communication network.
          </p>
          <p>
            The system uses a Manchester-encoded visible light channel (ESP32 + LED/LDR) as the primary data link, falling back to Wi-Fi when needed. This dashboard provides real-time monitoring, message transmission, and signal analytics.
          </p>
        </CardContent>
      </Card>

      {/* Team */}
      <Card className="glass-card shadow-card">
        <CardHeader><CardTitle>Team</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {teamMembers.map((member) => (
              <div key={member.name} className="p-4 rounded-lg bg-secondary/50 space-y-1">
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-primary">{member.role}</p>
                <p className="text-xs text-muted-foreground">{member.bio}</p>
                {member.email && (
                  <a href={`mailto:${member.email}`} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground mt-1">
                    <Mail className="h-3 w-3" />{member.email}
                  </a>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact form */}
      <Card className="glass-card shadow-card">
        <CardHeader><CardTitle>Contact Us</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <Button type="submit" className="gap-2"><Send className="h-4 w-4" /> Send Message</Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
