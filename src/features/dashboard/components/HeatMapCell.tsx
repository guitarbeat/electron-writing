import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';

export function HeatMapCell({ 
  day, 
  stats, 
  onDateClick, 
  selectedDateStr, 
  activeColor 
}: any) {
  const dateStr = format(day, 'yyyy-MM-dd');
  const row = stats.rows.find((r: any) => r.dateStr === dateStr);
  const words = row && row.status !== 'Pending' ? row.wordsWritten : 0;
  const target = row ? row.target : stats.dynamicBaseline;
  
  const isSelected = dateStr === selectedDateStr;
  
  const style = useMemo(() => {
    const targetVal = row ? row.target : stats.dynamicBaseline;
    const baseColor = activeColor || '#facc15';
    
    const withAlpha = (hex: string, alpha: number) => {
      const hexClean = hex.replace('#', '');
      const r = parseInt(hexClean.slice(0, 2), 16);
      const g = parseInt(hexClean.slice(2, 4), 16);
      const b = parseInt(hexClean.slice(4, 6), 16);
      // Fallback for missing colors
      if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(43, 23, 32, ${alpha})`;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    if (words === 0) return { backgroundColor: 'transparent', borderColor: 'rgba(43, 23, 32, 0.05)', color: 'transparent' };
    
    let alpha = 0.2;
    let borderColor = withAlpha(baseColor, 0.4);
    let textColor = '#2b1720';
    let boxShadow = 'none';

    if (words < targetVal * 0.5) alpha = 0.4;
    else if (words < targetVal) {
      alpha = 0.6;
      borderColor = withAlpha(baseColor, 0.8);
    } else {
      alpha = 1;
      borderColor = '#2b1720';
      textColor = '#fff';
      boxShadow = '2px 2px 0 #2b1720';
    }

    return {
      backgroundColor: withAlpha(baseColor, alpha),
      borderColor,
      color: textColor,
      boxShadow
    };
  }, [words, row, stats.dynamicBaseline, activeColor]);

  const tooltip = `${format(day, 'MMM d, yyyy')}: ${words} words` + (row?.note ? ` - ${row.note}` : '');

  return (
    <button 
      title={tooltip}
      onClick={() => onDateClick && onDateClick(dateStr)}
      className={cn(
        "aspect-square rounded-lg border-2 transition-all duration-300 relative flex items-center justify-center overflow-hidden",
        "hover:scale-105 hover:shadow-sticker hover:z-10",
        isSelected && "ring-4 ring-primary ring-offset-2 scale-105 z-10 shadow-sticker"
      )}
      style={style}
    />
  );
}
