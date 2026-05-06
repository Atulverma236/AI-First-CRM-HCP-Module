import React from 'react';
import { useSelector } from 'react-redux';
import { Activity, TrendingUp, Users, Calendar } from 'lucide-react';

const StatsBar = () => {
  const { interactions } = useSelector(s => s.interaction);

  const total = interactions.length;
  const positive = interactions.filter(i => i.sentiment === 'Positive').length;
  const thisWeek = interactions.filter(i => {
    const d = new Date(i.created_at || i.date);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) <= 7;
  }).length;
  const uniqueHCPs = new Set(interactions.map(i => i.hcp_name)).size;

  const stats = [
    { label: 'Total Interactions', value: total, icon: Activity, color: '#2563eb' },
    { label: 'Positive Sentiment', value: `${total ? Math.round((positive / total) * 100) : 0}%`, icon: TrendingUp, color: '#16a34a' },
    { label: 'Unique HCPs', value: uniqueHCPs, icon: Users, color: '#7c3aed' },
    { label: 'This Week', value: thisWeek, icon: Calendar, color: '#d97706' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      marginBottom: 24,
    }}>
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: color + '15',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon size={18} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
