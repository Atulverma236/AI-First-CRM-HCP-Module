import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInteractions } from '../../store/slices/interactionSlice';
import { Clock, User, MessageSquare, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

const sentimentStyle = {
  Positive: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' },
  Neutral:  { background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1' },
  Negative: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' },
};

const InteractionHistory = () => {
  const dispatch = useDispatch();
  const { interactions } = useSelector(s => s.interaction);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  if (interactions.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px 20px',
        color: 'var(--text-muted)', fontSize: 13
      }}>
        <MessageSquare size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
        <div>No interactions logged yet.</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Submit the form or use the chat to log your first one.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {interactions.map(item => {
        const isOpen = expanded === item.id;
        const sentiment = item.sentiment || 'Neutral';
        return (
          <div key={item.id} style={{
            border: '1px solid var(--border)', borderRadius: 10,
            background: '#fff', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'box-shadow 0.15s'
          }}>
            {/* Header Row */}
            <div
              onClick={() => setExpanded(isOpen ? null : item.id)}
              style={{
                padding: '12px 14px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={15} color="var(--primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                    {item.hcp_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
                    <span>{item.interaction_type}</span>
                    <span>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {item.date} {item.time}
                    </span>
                    <span>·</span>
                    <span style={{
                      ...sentimentStyle[sentiment],
                      padding: '1px 7px', borderRadius: 10, fontSize: 11
                    }}>
                      {sentiment}
                    </span>
                  </div>
                </div>
              </div>
              {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
            </div>

            {/* Expanded Detail */}
            {isOpen && (
              <div style={{
                padding: '0 14px 14px',
                borderTop: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: 10
              }}>
                {item.ai_summary && (
                  <div style={{
                    background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)',
                    border: '1px solid #c7d2fe', borderRadius: 8, padding: 12, marginTop: 10
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', marginBottom: 4 }}>
                      ✦ AI Summary
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                      {item.ai_summary}
                    </div>
                  </div>
                )}

                <DetailRow label="Topics Discussed" value={item.topics_discussed} />
                <DetailRow label="Outcomes" value={item.outcomes} />
                <DetailRow label="Follow-up Actions" value={item.follow_up_actions} />
                {item.attendees && <DetailRow label="Attendees" value={item.attendees} />}

                {item.materials_shared?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      MATERIALS SHARED
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {item.materials_shared.map((m, i) => (
                        <span key={i} style={{
                          padding: '2px 9px', background: 'var(--primary-light)',
                          borderRadius: 20, fontSize: 11, color: 'var(--primary)',
                          border: '1px solid #bfdbfe'
                        }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'right', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    via {item.source === 'chat' ? '🤖 AI Chat' : '📝 Form'} · ID #{item.id}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const DetailRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {value}
      </div>
    </div>
  );
};

export default InteractionHistory;
