import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const About = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: 'Message Sent',
      description: 'Thank you for your feedback! We will get back to you soon.',
    });
    
    setFormData({ name: '', email: '', message: '' });
  };

  const teamMembers = [
    {
      name: 'Gowreesh V T',
      role: 'Project Lead & Developer',
      email: 'vt.gowreesh43@gmail.com',
      bio: 'First year Computer Science Engineering Student',
    },
    {
      name: 'Anvesha',
      role: 'Software Engineer',
      email: 'anveshachoudary21@gmail.com',
      bio: 'First year Computer Science Engineering Student',
    },
    {
      name: 'Shruthishree',
      role: 'Hardware Engineer',
      email: '',
      bio: 'First year Electrical and Electronics Engineering Student',
    },
    {
      name: 'Sidharth',
      role: 'Hardware Engineer',
      email: '',
      bio: 'First year Electrical and Electronics Engineering Student',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold">About the Project</h1>
        <p className="text-muted-foreground">
          Learn more about the Li-Fi communication system
        </p>
      </div>

      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            The <strong>Hybrid Li-Fi + Wi-Fi Communication System</strong> is an
            innovative academic engineering project that combines the advantages of
            Light Fidelity (Li-Fi) and traditional Wi-Fi technologies to create a
            robust, high-speed wireless communication network.
          </p>
          
          <div className="space-y-3 pt-4">
            <h3 className="font-semibold text-lg">Key Features</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <span>
                  <strong>Hybrid Communication:</strong> Seamlessly switches between
                  Li-Fi and Wi-Fi based on optimal conditions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <span>
                  <strong>High Data Rates:</strong> Achieves transmission speeds up
                  to 15 Mbps using visible light modulation
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <span>
                  <strong>Real-time Monitoring:</strong> Comprehensive dashboard for
                  tracking signal quality and system performance
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <span>
                  <strong>ESP32 Integration:</strong> Uses ESP32 microcontrollers for
                  transmitter and receiver modules
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-4">
            <h3 className="font-semibold text-lg">Technology Stack</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                'React',
                'TypeScript',
                'Tailwind CSS',
                'Node.js',
                'Express',
                'MQTT',
                'Socket.io',
                'Recharts',
              ].map((tech) => (
                <div
                  key={tech}
                  className="px-3 py-2 rounded-lg bg-muted/50 text-center text-sm font-medium"
                >
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.email}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-lg glass-card"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-24 w-24 rounded-full gradient-primary flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-primary font-medium">{member.role}</p>
                    <p className="text-muted-foreground">{member.bio}</p>
                    
                    {member.email && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            window.open(`mailto:${member.email}`, '_blank')
                          }
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle>Contact & Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Your message or feedback..."
                rows={5}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
              />
            </div>

            <Button type="submit" className="gap-2">
              <Send className="h-4 w-4" />
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default About;
