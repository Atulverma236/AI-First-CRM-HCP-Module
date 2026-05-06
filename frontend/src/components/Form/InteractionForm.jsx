import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateForm, submitInteractionForm, resetForm, setAiSuggestions } from '../../store/slices/interactionSlice';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Mic, Search, Plus, Sparkles, Send, RotateCcw } from 'lucide-react';

const API = 'http://localhost:8000/api';

const InteractionForm = () => {
  const dispatch = useDispatch();
  const { form, loading, success, aiSuggestions } = useSelector(s => s.interaction);
  const [materialInput, setMaterialInput] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleChange = (field, value) => {
    dispatch(updateForm({ [field]: value }));
  };

  const addMaterial = () => {
    if (materialInput.trim()) {
      handleChange('materials_shared', [...form.materials_shared, materialInput.trim()]);
      setMaterialInput('');
    }
  };

  const addSample = () => {
    if (sampleInput.trim()) {
      handleChange('samples_distributed', [...form.samples_distributed, sampleInput.trim()]);
      setSampleInput('');
    }
  };

  const getSuggestions = async () => {
    if (!form.topics_discussed) return toast.error('Please enter topics discussed first');
    setLoadingSuggestions(true);
    try {
      const res = await axios.post(`${API}/agent/chat`, {
        message: `Suggest follow-up actions for HCP interaction: HCP: ${form.hcp_name}, Topics: ${form.topics_discussed}, Sentiment: ${form.sentiment}, Outcomes: ${form.outcomes}`,
        history: []
      });
      // parse suggestions from AI response
      const text = res.data.response;
      const lines = text.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().match(/^\d\./));
      if (lines.length > 0) {
        dispatch(setAiSuggestions(lines.map(l => l.replace(/^[-•\d.]\s*/, '').trim())));
      } else {
        dispatch(setAiSuggestions([text]));
      }
    } catch (e) {
      toast.error('Could not get AI suggestions');
    }
    setLoadingSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hcp_name) return toast.error('Please enter HCP name');
    const result = await dispatch(submitInteractionForm({ ...form, source: 'form' }));
    if (submitInteractionForm.fulfilled.match(result)) {
      toast.success('Interaction logged successfully!');
      dispatch(resetForm());
    } else {
      toast.error('Failed to log interaction');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.15s',
    background: '#fff',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const fieldStyle = { marginBottom: 16 };

  const sentimentColors = {
    Positive: { bg: '#f0fdf4', border: '#86efac', text: '#16a34a' },
    Neutral: { bg: '#f8fafc', border: '#cbd5e1', text: '#64748b' },
    Negative: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
  };

  return (
    <form onSubmit={handleSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>

        {/* HCP Name + Interaction Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...fieldStyle }}>
          <div>
            <label style={labelStyle}>HCP Name *</label>
            <input
              style={inputStyle}
              placeholder="Search or select HCP..."
              value={form.hcp_name}
              onChange={e => handleChange('hcp_name', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Interaction Type</label>
            <select
              style={inputStyle}
              value={form.interaction_type}
              onChange={e => handleChange('interaction_type', e.target.value)}
            >
              {['Meeting', 'Call', 'Conference', 'Virtual Meeting', 'Email', 'Sample Drop'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...fieldStyle }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" style={inputStyle} value={form.date}
              onChange={e => handleChange('date', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Time</label>
            <input type="time" style={inputStyle} value={form.time}
              onChange={e => handleChange('time', e.target.value)} />
          </div>
        </div>

        {/* Attendees */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Attendees</label>
          <input style={inputStyle} placeholder="Enter names or search..."
            value={form.attendees} onChange={e => handleChange('attendees', e.target.value)} />
        </div>

        {/* Topics Discussed */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Topics Discussed</label>
          <div style={{ position: 'relative' }}>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Enter key discussion points..."
              value={form.topics_discussed}
              onChange={e => handleChange('topics_discussed', e.target.value)}
            />
            <button type="button" title="Voice Note" style={{
              position: 'absolute', bottom: 8, right: 8,
              background: 'none', border: 'none', padding: 4,
              color: 'var(--text-muted)', cursor: 'pointer'
            }}>
              <Mic size={16} />
            </button>
          </div>
          <button type="button" onClick={getSuggestions} style={{
            marginTop: 6, display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none', padding: 0,
            color: 'var(--primary)', fontSize: 12, fontWeight: 500
          }}>
            <Sparkles size={13} />
            Summarize from Voice Note (Requires Consent)
          </button>
        </div>

        {/* Materials Shared */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Materials Shared</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Add material..."
              value={materialInput} onChange={e => setMaterialInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMaterial())} />
            <button type="button" onClick={addMaterial} style={{
              padding: '9px 14px', background: 'var(--primary-light)',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 500
            }}>
              <Search size={13} /> Search/Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {form.materials_shared.map((m, i) => (
              <span key={i} style={{
                padding: '3px 10px', background: 'var(--primary-light)',
                borderRadius: 20, fontSize: 12, color: 'var(--primary)',
                border: '1px solid #bfdbfe'
              }}>
                {m} <span onClick={() => handleChange('materials_shared', form.materials_shared.filter((_, j) => j !== i))}
                  style={{ cursor: 'pointer', marginLeft: 4 }}>×</span>
              </span>
            ))}
            {form.materials_shared.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No materials added</span>}
          </div>
        </div>

        {/* Samples Distributed */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Samples Distributed</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Add sample..."
              value={sampleInput} onChange={e => setSampleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSample())} />
            <button type="button" onClick={addSample} style={{
              padding: '9px 14px', background: 'var(--primary-light)',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 500
            }}>
              <Plus size={13} /> Add Sample
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {form.samples_distributed.map((s, i) => (
              <span key={i} style={{
                padding: '3px 10px', background: '#f0fdf4',
                borderRadius: 20, fontSize: 12, color: 'var(--success)',
                border: '1px solid #bbf7d0'
              }}>
                {s} <span onClick={() => handleChange('samples_distributed', form.samples_distributed.filter((_, j) => j !== i))}
                  style={{ cursor: 'pointer', marginLeft: 4 }}>×</span>
              </span>
            ))}
            {form.samples_distributed.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No samples added</span>}
          </div>
        </div>

        {/* Sentiment */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Observed/Inferred HCP Sentiment</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Positive', 'Neutral', 'Negative'].map(s => {
              const colors = sentimentColors[s];
              const selected = form.sentiment === s;
              return (
                <label key={s} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${selected ? colors.border : 'var(--border)'}`,
                  background: selected ? colors.bg : '#fff',
                  color: selected ? colors.text : 'var(--text-secondary)',
                  fontWeight: selected ? 600 : 400, fontSize: 13,
                  transition: 'all 0.15s'
                }}>
                  <input type="radio" name="sentiment" value={s} checked={selected}
                    onChange={() => handleChange('sentiment', s)} style={{ display: 'none' }} />
                  {s}
                </label>
              );
            })}
          </div>
        </div>

        {/* Outcomes */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Outcomes</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
            placeholder="Key outcomes or agreements..."
            value={form.outcomes} onChange={e => handleChange('outcomes', e.target.value)} />
        </div>

        {/* Follow-up Actions */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Follow-up Actions</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
            placeholder="Enter next steps or tasks..."
            value={form.follow_up_actions} onChange={e => handleChange('follow_up_actions', e.target.value)} />
        </div>

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
            border: '1px solid #bfdbfe', borderRadius: 10, padding: 14, marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, fontSize: 12, color: 'var(--primary)' }}>
              <Sparkles size={13} /> AI Suggested Follow-ups
            </div>
            {aiSuggestions.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4,
                fontSize: 12, color: 'var(--text)'
              }}>
                <span style={{ color: 'var(--primary)', marginTop: 2 }}>→</span>
                <span style={{ cursor: 'pointer' }} onClick={() => handleChange('follow_up_actions',
                  form.follow_up_actions ? form.follow_up_actions + '\n' + s : s
                )}>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 8
      }}>
        <button type="button" onClick={() => dispatch(resetForm())} style={{
          flex: 1, padding: '10px', background: '#fff',
          border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text-secondary)', fontWeight: 500, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
        }}>
          <RotateCcw size={14} /> Reset
        </button>
        <button type="submit" disabled={loading} style={{
          flex: 2, padding: '10px 20px',
          background: loading ? '#93c5fd' : 'var(--primary)',
          border: 'none', borderRadius: 8,
          color: '#fff', fontWeight: 600, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'background 0.15s'
        }}>
          <Send size={14} />
          {loading ? 'Logging...' : 'Log Interaction'}
        </button>
      </div>
    </form>
  );
};

export default InteractionForm;
