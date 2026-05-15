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
  return (
    <div className="sticker-card p-6 md:p-8 bg-white h-[450px] flex flex-col gap-6">
      <div className="flex justify-end items-center flex-wrap gap-4">
        <div className="flex bg-bg-paper p-1 border-2 border-ink rounded-lg gap-1">
          {(['daily', 'weekly', 'cumulative'] as const).map(v => (
            <button
              key={v}
              onClick={() => setChartView(v)}
              className={`text-[10px] font-black uppercase px-3 py-1 rounded transition-colors ${chartView === v ? 'bg-ink text-white' : 'hover:bg-primary/10'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
          <LineChart data={chartData} margin={{ bottom: 20, left: 20, top: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(43, 23, 32, 0.1)" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#2b1720', fontSize: 10, fontWeight: 700 }}
              axisLine={{ stroke: '#2b1720', strokeWidth: 2 }}
              tickFormatter={(v) => format(parseISO(v), 'MMM d')}
              label={{ value: 'Date', position: 'insideBottom', offset: -15, fill: '#2b1720', fontSize: 12, fontWeight: 800 }}
            />
            <YAxis 
              tick={{ fill: '#2b1720', fontSize: 10, fontWeight: 700 }}
              axisLine={{ stroke: '#2b1720', strokeWidth: 2 }}
              label={{ value: settings?.metric === 'pages' ? 'Pages' : 'Words', angle: -90, position: 'insideLeft', offset: -10, fill: '#2b1720', fontSize: 12, fontWeight: 800 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fffafc', 
                border: '4px solid #2b1720',
                borderRadius: '16px',
                boxShadow: '4px 4px 0 #2b1720'
              }}
              itemStyle={{ fontWeight: 800 }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}/>
            <Line name={settings?.personAName || 'Aaron'} type="monotone" dataKey="Aaron" stroke={settings?.personAColor || '#ff4d8d'} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} />
            <Line name={settings?.personBName || 'Electra'} type="monotone" dataKey="Electra" stroke={settings?.personBColor || '#7c3aed'} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} />
            <Line name="Together" type="monotone" dataKey="Team" stroke={settings?.teamColor || '#10b981'} strokeWidth={5} dot={{ r: 4, strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
