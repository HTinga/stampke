import React from 'react';
import { motion } from 'motion/react';

export default function WaveformLoader() {
  return (
    <div className="flex items-center gap-1 h-12">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: [12, 40, 15, 35, 12],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
          className="w-1.5 bg-gradient-to-t from-violet-600 to-fuchsia-400 rounded-full"
        />
      ))}
    </div>
  );
}
