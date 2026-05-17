import React from 'react';
import { BarChart3 } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Settings } from '../../../types';

interface ProgressChartProps {
  chartView: 'daily' | 'weekly' | 'cumulative';
  setChartView: (view: 'daily' | 'weekly' | 'cumulative') => void;
  chartData: any[];
  settings: Settings | null;
}

export function ProgressChart({ chartView, setChartView, chartData, settings }: ProgressChartProps) {
  const hasChartData = chartData.length > 0;

  return (
    <div className="sticker-card p-4 sm:p-6 md:p-8 bg-white h-[380px] sm:h-[450px] flex flex-col gap-4 sm:gap-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-heading text-lg sm:text-xl flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Progress
        </h3>
        <div className="flex bg-bg-paper p-1 border-2 border-ink rounded-lg gap-1">
          {(['daily', 'weekly', 'cumulative'] as const).map(v => (
            <button
              key={v}
              onClick={() => setChartView(v)}
              aria-pressed={chartView === v}
              className={`text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-3 py-1 rounded transition-colors ${chartView === v ? 'bg-ink text-white' : 'hover:bg-primary/10'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ bottom: 5, left: -20, top: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(43, 23, 32, 0.1)" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#2b1720', fontSize: 9, fontWeight: 700 }}
              axisLine={{ stroke: '#2b1720', strokeWidth: 2 }}
              tickFormatter={(v) => format(parseISO(v), 'MM/dd')}
            />
            <YAxis 
              tick={{ fill: '#2b1720', fontSize: 9, fontWeight: 700 }}
              axisLine={{ stroke: '#2b1720', strokeWidth: 2 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fffafc',
                border: '4px solid #2b1720',
                borderRadius: '16px',
                boxShadow: '4px 4px 0 #2b1720',
                fontSize: '12px'
              }}
              itemStyle={{ fontWeight: 800, padding: '2px 0' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}/>
            <Line name={settings?.personAName || 'Aaron'} type="monotone" dataKey="Aaron" stroke={settings?.personAColor || '#ff4d8d'} strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            <Line name={settings?.personBName || 'Electra'} type="monotone" dataKey="Electra" stroke={settings?.personBColor || '#7c3aed'} strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            <Line name="Team" type="monotone" dataKey="Team" stroke={settings?.teamColor || '#2b1720'} strokeWidth={4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>

        {!hasChartData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-bg-paper border-2 border-ink px-4 py-3 shadow-[4px_4px_0_var(--color-ink)] text-center">
              <p className="text-label text-[10px] text-ink-muted">No entries yet</p>
              <p className="text-sm font-bold text-ink mt-1">Start with a ledger tile below.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
