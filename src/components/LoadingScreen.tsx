import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
        >
          <Zap className="h-16 w-16 text-primary shadow-glow" />
        </motion.div>
        
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <p className="text-lg font-semibold text-gradient">
            Initializing Li-Fi System...
          </p>
        </motion.div>
      </div>
    </div>
  );
};
