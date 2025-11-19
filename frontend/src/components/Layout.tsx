import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Sun, Moon, Gauge, Send, Radio, Settings, BarChart3, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/transmitter', label: 'Transmitter', icon: Send },
  { to: '/receiver', label: 'Receiver', icon: Radio },
  { to: '/network', label: 'Network', icon: Settings },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/about', label: 'About', icon: Info },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [now, setNow] = useState<string>(new Date().toLocaleString());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date().toLocaleString()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen grid grid-rows-[auto,1fr] md:grid-cols-[260px,1fr] md:grid-rows-1">
      <aside className="glass hidden md:flex flex-col p-4 gap-2">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Wifi className="text-brand" /> Hybrid Li-Fi + Wi-Fi
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-200/40 dark:hover:bg-gray-800/60 ${isActive ? 'bg-brand/10 text-brand' : ''}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto text-xs opacity-70">© {new Date().getFullYear()} Gowreesh V.T.</div>
      </aside>

      <header className="glass sticky top-0 z-10 flex items-center justify-between p-3 md:p-4 md:col-start-2">
        <div className="flex items-center gap-2">
          <div className="md:hidden font-semibold">Hybrid Li-Fi + Wi-Fi</div>
          <span className="hidden md:inline text-sm opacity-80">{now}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="rounded-md p-2 hover:bg-gray-200/40 dark:hover:bg-gray-800/60" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="p-3 md:p-6 space-y-4 md:col-start-2 max-w-7xl w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 md:hidden glass backdrop-blur-md rounded-full px-2 py-2 flex gap-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-1 rounded-full text-[10px] ${isActive ? 'text-brand' : ''}`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}


