import React from 'react';
import { LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: (dateStr: string) => void;
  className?: string;
  iconClassName?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className,
  iconClassName
}: EmptyStateProps) {
  return (
    <div className={cn("absolute inset-0 z-[40] flex flex-col items-center justify-center bg-[var(--bg-glass)]/80 rounded-[var(--radius-card)]", className)}>
      <div className="p-8 bg-[var(--bg-surface)] border-4 border-ink rounded-[var(--radius-card)] shadow-sticker flex flex-col items-center text-center max-w-sm transform hover:scale-[1.02] transition-transform">
        <div className={cn("w-16 h-16 rounded-2xl bg-primary/10 border-2 border-ink flex items-center justify-center mb-6 shadow-[4px_4px_0_var(--color-ink)] rotate-3", iconClassName)}>
           <Icon className="w-8 h-8 text-primary" />
        </div>
        <h4 className="text-display !text-xl mb-2">{title}</h4>
        <p className="text-body text-ink/60 mb-6 max-w-[240px] text-sm leading-relaxed">
          {description}
        </p>
        <button 
          onClick={() => onAction?.(format(new Date(), 'yyyy-MM-dd'))}
          className="button-playful w-full py-3 text-sm"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
