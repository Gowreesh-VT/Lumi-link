'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Wifi, Lightbulb, Radio, BarChart3, Shield, Zap,
  ArrowRight, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useMemo } from 'react';

// Seeded pseudo-random so server and client produce identical values
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export default function LandingPage() {
  const router = useRouter();
  const [, setScrollY] = useState(0);

  const bubbles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      width: seededRandom(i * 4) * 100 + 50,
      height: seededRandom(i * 4 + 1) * 100 + 50,
      left: seededRandom(i * 4 + 2) * 100,
      top: seededRandom(i * 4 + 3) * 100,
      duration: seededRandom(i) * 5 + 5,
    })),
  []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeInUp = { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0 } };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const features = [
    { icon: Lightbulb, title: 'Li-Fi Technology', description: 'High-speed data transmission using visible light communication', color: 'text-yellow-500' },
    { icon: Wifi, title: 'Wi-Fi Integration', description: 'Seamless fallback to traditional wireless networks', color: 'text-blue-500' },
    { icon: Zap, title: 'Ultra Fast', description: 'Transmission speeds up to 15 Mbps with low latency', color: 'text-purple-500' },
    { icon: Shield, title: 'Secure', description: 'Light-based communication ensures enhanced security', color: 'text-green-500' },
    { icon: BarChart3, title: 'Real-time Analytics', description: 'Comprehensive monitoring and data visualization', color: 'text-orange-500' },
    { icon: Radio, title: 'IoT Ready', description: 'ESP32 microcontroller integration for IoT applications', color: 'text-pink-500' },
  ];

  const stats = [
    { value: '15', label: 'Mbps Speed', suffix: '' },
    { value: '99', label: 'Uptime', suffix: '%' },
    { value: '2', label: 'Communication Modes', suffix: '' },
    { value: '<10', label: 'Latency', suffix: 'ms' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {bubbles.map((b, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: b.width,
                height: b.height,
                left: `${b.left}%`,
                top: `${b.top}%`,
              }}
              animate={{ y: [0, -30, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: b.duration, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
            <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity }} className="inline-block mb-6">
              <Lightbulb className="w-20 h-20 text-yellow-300 fill-yellow-300" />
            </motion.div>
            <motion.h1 className="text-5xl md:text-7xl font-bold mb-6" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
              LumiLink
            </motion.h1>
            <motion.p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}>
              Next-generation wireless communication system combining the power of light and radio waves
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}>
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg" onClick={() => router.push('/dashboard')}>
                Launch Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg" onClick={() => router.push('/about')}>
                Learn More
              </Button>
            </motion.div>
          </motion.div>
          <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown className="w-8 h-8 text-white/70" />
          </motion.div>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section className="py-20 bg-gradient-to-b from-gray-900 to-gray-800 text-white" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} variants={fadeInUp} className="text-center">
                <motion.div className="text-4xl md:text-6xl font-bold mb-2" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1, type: 'spring' }}>
                  {stat.value}<span className="text-2xl">{stat.suffix}</span>
                </motion.div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section className="py-20 bg-gray-50 dark:bg-gray-900" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer}>
        <div className="container mx-auto px-6">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Experience the future of wireless communication with our hybrid system</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={fadeInUp} whileHover={{ scale: 1.05, y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Card className="h-full glass-card shadow-card hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <motion.div className="mb-4" whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                        <Icon className={`w-12 h-12 ${feature.color}`} />
                      </motion.div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section className="py-20 bg-white dark:bg-gray-800" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer}>
        <div className="container mx-auto px-6">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Three simple steps to revolutionize your wireless experience</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Light Transmission', description: 'Data is encoded into light waves using high-intensity LEDs' },
              { step: '02', title: 'Photodetection', description: 'Photodiodes receive and decode the light signals' },
              { step: '03', title: 'Hybrid Switching', description: 'Automatically switches to Wi-Fi when needed' },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeInUp} className="text-center">
                <div className="text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4">Ready to Experience Li-Fi?</h2>
          <p className="text-xl mb-8 text-white/90">Access the real-time dashboard and start communicating</p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-10 py-6 text-lg" onClick={() => router.push('/dashboard')}>
            Open Dashboard <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
