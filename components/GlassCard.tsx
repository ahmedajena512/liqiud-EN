
import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverEffect ? { 
        scale: 1.01,
        y: -5,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 20px rgba(6, 182, 212, 0.15)"
      } : {}}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`
        liquid-glass rounded-2xl p-4 sm:p-6 
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};
