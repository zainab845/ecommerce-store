'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Period = 'monthly' | 'quarterly' | 'yearly';

interface DataPoint {
  name: string;
  revenue: number;
}

interface Props {
  monthly: DataPoint[];
  quarterly: DataPoint[];
  yearly: DataPoint[];
}

const periodLabels: Record<Period, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export default function RevenueChart({ monthly, quarterly, yearly }: Props) {
  const [period, setPeriod] = useState<Period>('monthly');

  const data = { monthly, quarterly, yearly }[period];

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-semibold text-lg text-gray-900">Revenue</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Total: <span className="font-semibold text-gray-900">${totalRevenue.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          {(Object.keys(periodLabels) as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                period === p
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {totalRevenue === 0 ? (
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-sm">No revenue data yet</p>
            <p className="text-gray-300 text-xs mt-1">Revenue will appear here once orders are placed</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
         <Tooltip
  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
  contentStyle={{
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
    fontSize: '13px',
  }}
  cursor={{ fill: '#f9fafb' }}
/>
            <Bar dataKey="revenue" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}