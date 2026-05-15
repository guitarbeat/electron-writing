import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  iconBgClass: string;
  cardBgHoverClass: string;
  onClick?: () => void;
  isEditing?: boolean;
  editContent?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  iconBgClass,
  cardBgHoverClass,
  onClick,
  isEditing,
  editContent,
  className
}: StatCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn("sticker-card p-10 flex flex-col gap-6 cursor-pointer group", cardBgHoverClass, className)}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-label text-ink">{label}</span>
        <div className={cn("w-12 h-12 rounded-full border-4 border-ink flex items-center justify-center shadow-sticker-active", iconBgClass)}>
          <Icon className="w-6 h-6 text-ink" />
        </div>
      </div>
      
      {isEditing ? (
        <div onClick={e => e.stopPropagation()}>
          {editContent}
        </div>
      ) : (
        <div className="flex items-baseline gap-3">
          <span className="text-data text-[3.5rem] tracking-tight">{value}</span>
          {subValue && <span className="text-label text-ink/40">{subValue}</span>}
        </div>
      )}
    </motion.div>
  );
}
