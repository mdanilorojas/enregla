import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Location, Permit } from '@/types/database';
import { getLocationPermitStats } from '@/lib/dashboard-metrics';
import { Card } from '@/components/ui';
import { Building2 } from 'lucide-react';

interface Props {
  locations: Location[];
  permits: Permit[];
}

export function ComplianceTrend({ locations, permits }: Props) {
  const data = useMemo(() => {
    return locations.map(loc => {
      const locPermits = permits.filter(p => p.location_id === loc.id && p.is_active);
      const stats = getLocationPermitStats(locPermits);
      const compliance = stats.total > 0 ? Math.round((stats.vigentes / stats.total) * 100) : 0;
      return {
        name: loc.name.length > 12 ? loc.name.substring(0, 12) + '...' : loc.name,
        fullName: loc.name,
        compliance,
      };
    }).sort((a, b) => b.compliance - a.compliance);
  }, [locations, permits]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Cumplimiento por Sede</h3>
        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
          <Building2 size={14} className="text-slate-400" />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={32}>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} 
            domain={[0, 100]}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', padding: '12px' }}
            formatter={(value: number) => [`${value}%`, 'Cumplimiento']}
            labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ''}
            labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Bar dataKey="compliance" radius={[6, 6, 6, 6]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.compliance >= 80 ? '#10b981' : entry.compliance >= 50 ? '#f59e0b' : '#ef4444'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
