import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab } from '../../store/slices/interactionSlice';
import { FileText, Bot } from 'lucide-react';

const TabSwitcher = () => {
  const dispatch = useDispatch();
  const activeTab = useSelector(s => s.interaction.activeTab);

  const tabs = [
    { id: 'form', label: 'Structured Form', icon: FileText },
    { id: 'chat', label: 'AI Chat', icon: Bot },
  ];

  return (
    <div style={{
      display: 'flex',
      background: '#f1f5f9',
      borderRadius: 10,
      padding: 3,
      gap: 3,
      marginBottom: 20,
    }}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => dispatch(setActiveTab(id))}
            style={{
              flex: 1, padding: '8px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: active ? '#fff' : 'transparent',
              border: 'none',
              borderRadius: 8,
              fontWeight: active ? 600 : 500,
              fontSize: 13,
              color: active ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
              cursor: 'pointer'
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default TabSwitcher;
