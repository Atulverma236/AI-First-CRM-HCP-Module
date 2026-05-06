import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChatMessage, addUserMessage, clearChat } from '../../store/slices/chatSlice';
import { Bot, Send, Trash2, CheckCircle, Zap, ChevronDown, ChevronUp } from 'lucide-react';

// ── Dynamic tool definitions — each sends a REAL request to LangGraph ────────
const TOOLS = [
  {
    id: 1,
    name: 'log_interaction',
    label: 'Log Interaction',
    emoji: '✅',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#86efac',
    badgeBg: '#dcfce7',
    placeholder: 'Met Dr. Priya Patel at AIIMS Delhi. Discussed Product X efficacy and dosage for oncology. Positive sentiment. Shared brochure and gave 2 sample kits. Agreed to trial with 3 patients.',
  },
  {
    id: 2,
    name: 'edit_interaction',
    label: 'Edit Interaction',
    emoji: '✏️',
    color: '#854d0e',
    bg: '#fffbeb',
    border: '#fde68a',
    badgeBg: '#fef9c3',
    placeholder: 'Edit interaction ID 1 — change sentiment to Neutral and add follow-up: Send Phase III trial report by Friday',
  },
  {
    id: 3,
    name: 'get_hcp_history',
    label: 'HCP History',
    emoji: '📋',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
    badgeBg: '#e0f2fe',
    placeholder: 'Show me the full interaction history for Dr. Priya Patel',
  },
  {
    id: 4,
    name: 'suggest_follow_up',
    label: 'Suggest Follow-ups',
    emoji: '💡',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#e9d5ff',
    badgeBg: '#f3e8ff',
    placeholder: 'Suggest follow-up actions for Dr. Patel — discussed OncoBoost trial results, positive sentiment, agreed to prescribe for 3 patients next month',
  },
  {
    id: 5,
    name: 'analyze_sentiment',
    label: 'Analyze Sentiment',
    emoji: '🔍',
    color: '#c2410c',
    bg: '#fff7ed',
    border: '#fed7aa',
    badgeBg: '#ffedd5',
    placeholder: 'Analyze sentiment: The doctor seemed hesitant at first but became more open after reviewing the clinical data. She had concerns about pricing but was overall very interested in the trial.',
  },
];

// ── Expandable tool panel with editable input ─────────────────────────────────
const ToolPanel = ({ tool, isOpen, onToggle, onRun, loading }) => {
  const [customText, setCustomText] = useState(tool.placeholder);

  return (
    <div style={{
      border: `1px solid ${isOpen ? tool.border : 'var(--border)'}`,
      borderRadius: 9,
      background: isOpen ? tool.bg : '#fafafa',
      overflow: 'hidden',
      transition: 'all 0.15s',
    }}>
      {/* Tool header row — click to expand */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 11px', cursor: 'pointer',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            background: tool.badgeBg, color: tool.color,
            padding: '2px 7px', borderRadius: 20,
            border: `1px solid ${tool.border}`,
          }}>
            Tool {tool.id}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            {tool.emoji} {tool.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{tool.description}</span>
          {isOpen
            ? <ChevronUp size={13} color="var(--text-muted)" />
            : <ChevronDown size={13} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Expanded: editable input + run button */}
      {isOpen && (
        <div style={{ padding: '0 11px 11px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5 }}>
            ✏️ Edit the message below then click <strong>Run Tool</strong> — this sends a LIVE request to LangGraph:
          </div>
          <textarea
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            rows={3}
            style={{
              width: '100%', padding: '8px 10px',
              border: `1px solid ${tool.border}`,
              borderRadius: 8, fontSize: 12,
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.5, resize: 'vertical',
              outline: 'none', background: '#fff',
              color: 'var(--text)', marginBottom: 7,
            }}
          />
          <button
            onClick={() => onRun(customText)}
            disabled={loading || !customText.trim()}
            style={{
              width: '100%', padding: '8px',
              background: loading ? tool.border : tool.color,
              border: 'none', borderRadius: 8,
              color: '#fff', fontWeight: 700, fontSize: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.15s',
            }}>
            <Zap size={13} />
            {loading ? 'Running...' : `Run Tool ${tool.id} — ${tool.label}`}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ message }) => {
  const isUser  = message.role === 'user';
  const content = message.content || '';

  const isLogged = content.includes('logged successfully') || content.includes('Interaction DB ID');
  const isEdited = content.includes('updated!') || content.includes('updated successfully');
  const isTool3  = content.includes('Interaction(s)') || content.includes('HCP Profile');
  const isTool4  = content.includes('Follow-up') || content.includes('→');
  const isTool5  = content.includes('Sentiment Analysis') || content.includes('Sentiment:');

  let bgColor = '#f1f5f9', borderColor = 'transparent';
  if (isLogged)      { bgColor = '#f0fdf4'; borderColor = '#86efac'; }
  else if (isEdited) { bgColor = '#fffbeb'; borderColor = '#fde68a'; }
  else if (isTool3)  { bgColor = '#f0f9ff'; borderColor = '#bae6fd'; }
  else if (isTool4)  { bgColor = '#faf5ff'; borderColor = '#e9d5ff'; }
  else if (isTool5)  { bgColor = '#fff7ed'; borderColor = '#fed7aa'; }

  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      gap: 7, alignItems: 'flex-start',
    }}>
      {!isUser && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={13} color="#fff" />
        </div>
      )}
      <div style={{
        maxWidth: '86%', padding: '10px 13px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
        background: isUser ? 'var(--primary)' : bgColor,
        border: isUser ? 'none' : `1px solid ${borderColor}`,
        color: isUser ? '#fff' : 'var(--text)',
        fontSize: 12.5, lineHeight: 1.65,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {/* Tool badge */}
        {!isUser && (() => {
          let label = null, bg = '', col = '';
          if      (isLogged) { label = 'log_interaction';   bg = '#dcfce7'; col = '#16a34a'; }
          else if (isEdited) { label = 'edit_interaction';  bg = '#fef9c3'; col = '#854d0e'; }
          else if (isTool3)  { label = 'get_hcp_history';   bg = '#e0f2fe'; col = '#0369a1'; }
          else if (isTool4)  { label = 'suggest_follow_up'; bg = '#f3e8ff'; col = '#7c3aed'; }
          else if (isTool5)  { label = 'analyze_sentiment'; bg = '#ffedd5'; col = '#c2410c'; }
          if (!label) return null;
          return (
            <div style={{
              display: 'inline-block', marginBottom: 6,
              background: bg, color: col,
              fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 20,
            }}>
              {label}
            </div>
          );
        })()}
        {content}
      </div>
    </div>
  );
};

// ── Typing indicator ──────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
    <div style={{
      width: 26, height: 26, borderRadius: '50%',
      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Bot size={13} color="#fff" />
    </div>
    <div style={{
      padding: '10px 14px', background: '#f1f5f9',
      borderRadius: '4px 14px 14px 14px',
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, background: '#94a3b8',
          borderRadius: '50%', display: 'inline-block',
          animation: 'typingBounce 1.2s infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`@keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
    </span>
  </div>
);
const ChatInterface = () => {
  const dispatch = useDispatch();
  const { messages, loading, formFilled } = useSelector(s => s.chat);
  const [input, setInput]           = useState('');
  const [activeTool, setActiveTool] = useState(null); // which tool panel is open
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setActiveTool(null);
    dispatch(addUserMessage(msg));
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    dispatch(sendChatMessage({ message: msg, history }));
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleTool = (toolId) => {
    setActiveTool(prev => prev === toolId ? null : toolId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 580 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 12, marginBottom: 10, borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={19} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>AI Assistant</div>
            <div style={{ fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
              Online 
            </div>
          </div>
        </div>
        <button onClick={() => { dispatch(clearChat()); setActiveTool(null); }} style={{
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: 11,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        display: 'flex', gap: 8, marginTop: 10,
        paddingTop: 10, borderTop: '1px solid var(--border)', flexShrink: 0,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder='Or type freely... e.g. "Met Dr. Patel at AIIMS, discussed Product X, positive sentiment"'
          style={{
            flex: 1, padding: '10px 12px',
            border: '2px solid #979898',
            borderRadius: 10, fontSize: 12, resize: 'none',
            outline: 'none', minHeight: 44, maxHeight: 100,
            fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
            color: 'var(--text)', background: '#fafafa',
          }}
          rows={2}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          style={{
            width: 44, height: 44, borderRadius: 10, border: 'none',
            flexShrink: 0, alignSelf: 'flex-end',
            background: loading || !input.trim() ? '#bfdbfe' : 'var(--primary)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s', marginBottom: 5,
          }}>
          <Send size={16} />
        </button>
      </div>
      {/* ── Live Tool Buttons ── */}
      <div style={{ flexShrink: 0, marginBottom: 10 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {TOOLS.map(tool => (
            <ToolPanel
              key={tool.id}
              tool={tool}
              isOpen={activeTool === tool.id}
              onToggle={() => toggleTool(tool.id)}
              onRun={(text) => handleSend(text)}
              loading={loading}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
export default ChatInterface;
