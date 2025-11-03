import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'active' | 'inactive' | 'success' | 'error';
  label?: string;
  showPulse?: boolean;
}

export const StatusBadge = ({ status, label, showPulse = true }: StatusBadgeProps) => {
  const isPositive = status === 'online' || status === 'active' || status === 'success';
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            isPositive ? 'bg-success' : 'bg-destructive'
          )}
        />
        {showPulse && isPositive && (
          <div className="absolute inset-0 h-2 w-2 rounded-full bg-success animate-ping opacity-75" />
        )}
      </div>
      {label && (
        <span className="text-sm font-medium">
          {label}
        </span>
      )}
    </div>
  );
};
