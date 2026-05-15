import React from 'react';
import { motion } from 'motion/react';

interface AuthorAvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AuthorAvatar({ name, color, size = 'md', className = '' }: AuthorAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[8px]',
    md: 'w-12 h-12 text-[10px]',
    lg: 'w-20 h-20 text-[14px]'
  };

  return (
    <div 
      className={`relative shrink-0 rounded-full border-4 border-ink shadow-sticker flex items-center justify-center font-black uppercase tracking-widest text-white overflow-hidden ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color }}
    >
      {name.substring(0, 2)}
      <motion.div 
        className="absolute inset-0 bg-white/20"
        initial={{ y: '100%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
    </div>
  );
}
