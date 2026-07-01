import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { useInView } from 'framer-motion';

interface HandWritingTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export function HandWritingText({
  text,
  className = '',
  delay = 0,
  duration = 0.06,
}: HandWritingTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: duration,
        delayChildren: delay,
      },
    },
  };

  const charVariants = {
    hidden: {
      opacity: 0,
      y: 6,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ease: 'easeOut' as const,
        duration: 0.25,
      },
    },
  };

  return (
    <motion.span
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      aria-label={text}
      className={`font-handwriting inline-block ${className}`}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          variants={charVariants}
          className="inline-block"
          style={char === ' ' ? { width: '0.3em' } : undefined}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
