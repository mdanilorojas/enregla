import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { subDays, format } from 'date-fns';
import { Card } from '@/components/ui';
import { TrendingUp } from 'lucide-react';

interface ComplianceTrendProps {
  currentCompliance: number;
}

export function ComplianceTrend({ currentCompliance }: ComplianceTrendProps) {
  const data = useMemo(() => {
    // Generate last 30 days trend
    // In a real app, this would come from historical data
    return Array.from({ length: 30 }, (_, i) => {
      const baseCompliance = currentCompliance - 15 + (i / 30) * 15;
      const variance = (Math.random() - 0.5) * 10;
      return {
        date: format(subDays(new Date(), 29 - i), 'dd/MM'),
        compliance: Math.max(0, Math.min(100, baseCompliance + variance)),
        target: 85,
      };
    });
  }, [currentCompliance]);

  const trend = useMemo(() => {
    if (data.length < 2) return 0;
    const first = data[0].compliance;
    const last = data[data.length - 1].compliance;
    return ((last - first) / first * 100).toFixed(1);
  }, [data]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Tendencia de Cumplimiento</h3>
          <p className="text-sm text-gray-500 mt-0.5">Últimos 30 días</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <TrendingUp size={14} className="text-emerald-600" />
          <span className="text-sm font-bold text-emerald-600">+{trend}%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            domain={[0, 100]}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: any) => [`${Number(value).toFixed(1)}%`, '']}
            labelStyle={{ fontWeight: '600', marginBottom: '4px' }}
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Objetivo"
          />
          <Line
            type="monotone"
            dataKey="compliance"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 2 }}
            activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            name="Cumplimiento"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
