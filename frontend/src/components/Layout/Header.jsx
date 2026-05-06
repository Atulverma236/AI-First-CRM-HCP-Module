import React from 'react';
import { Activity, Bell, User } from 'lucide-react';

const Header = () => {
  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--primary)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Activity size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            PharmaConnect CRM
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -2 }}>
            HCP Engagement Platform
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{
          background: 'none', border: 'none',
          padding: '8px', borderRadius: 8,
          color: 'var(--secondary)',
          display: 'flex', alignItems: 'center'
        }}>
          <Bell size={18} />
        </button>
        <div style={{
          width: 34, height: 34,
          background: 'var(--primary-light)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary)',
          fontWeight: 600, fontSize: 13
        }}>
          JD
        </div>
      </div>
    </header>
  );
};

export default Header;
