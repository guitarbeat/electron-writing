import React from "react";
import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { LongPressColorArea } from "./LongPressColorArea";

export function GoalCard({ title, progress, target, color, textColor = '#2b1720', onColorChange }: { title: string, progress: number, target: number, color: string, textColor?: string, onColorChange?: (c: string) => void }) {
  const percent = Math.min(100, (progress / (target || 1)) * 100);
  return (
    <LongPressColorArea color={color} onColorChange={onColorChange} className="sticker-card p-4 bg-white flex flex-col gap-3">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span>{title}</span>
        <Trophy className="w-4 h-4" />
      </div>
      <div className="relative h-4 border-2 border-ink rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(43,23,32,0.1)' }}>
        <motion.div 
          className="absolute top-0 left-0 h-full border-r-2 border-ink"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between font-black text-xs">
        <span>{progress}</span>
        <span>{target}</span>
      </div>
    </LongPressColorArea>
  );
}
