import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import React from 'react';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('glass rounded-xl p-4', className)}>{children}</div>;
}

export function Button({ children, className, variant = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string; variant?: 'default' | 'outline' | 'ghost' }) {
  const base = 'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40';
  const map = {
    default: 'bg-brand text-white hover:bg-brand-dark',
    outline: 'border border-gray-300/50 dark:border-gray-700/50 hover:bg-gray-200/40 dark:hover:bg-gray-800/60',
    ghost: 'hover:bg-gray-200/40 dark:hover:bg-gray-800/60',
  } as const;
  return (
    <button className={clsx(base, map[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, color = 'green' }: { children: React.ReactNode; color?: 'green' | 'red' | 'yellow' | 'gray' }) {
  const map: Record<string, string> = {
    green: 'bg-green-500/15 text-green-600 dark:text-green-400',
    red: 'bg-red-500/15 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
    gray: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
  };
  return <span className={clsx('px-2 py-1 rounded text-xs', map[color])}>{children}</span>;
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded bg-gray-200/60 dark:bg-gray-800/60 overflow-hidden">
      <motion.div className="h-full bg-brand" initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.2 }} />
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx('w-full rounded-md bg-transparent border px-3 py-2 border-gray-300/60 dark:border-gray-700/60 focus:outline-none focus:ring-2 focus:ring-brand/40', props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx('w-full rounded-md bg-transparent border px-3 py-2 border-gray-300/60 dark:border-gray-700/60 focus:outline-none focus:ring-2 focus:ring-brand/40', props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx('w-full rounded-md bg-transparent border px-3 py-2 border-gray-300/60 dark:border-gray-700/60 focus:outline-none focus:ring-2 focus:ring-brand/40', props.className)} />;
}


