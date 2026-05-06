
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchInteractions } from '../store/slices/interactionSlice';
import InteractionForm from '../components/Form/InteractionForm';
import ChatInterface from '../components/Chat/ChatInterface';
import StatsBar from '../components/UI/StatsBar';

const LogInteraction = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: 'var(--text)',
          letterSpacing: '-0.5px', marginBottom: 4
        }}>
          Log HCP Interaction
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Record your interactions with Healthcare Professionals using the structured form or AI assistant.
        </p>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Main Layout: Form LEFT | Chat RIGHT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 420px',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* LEFT — Structured Form */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 24,
          boxShadow: 'var(--shadow)',
        }}>
          {/* Form Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 20, paddingBottom: 16,
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16
            }}>📋</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Interaction Details</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}></div>
            </div>
          </div>
          <InteractionForm />
        </div>

        {/* RIGHT — AI Chat */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 20,
          boxShadow: 'var(--shadow)',
          position: 'sticky',
          top: 80,
          maxHeight: 'calc(150vh - 100px)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default LogInteraction;