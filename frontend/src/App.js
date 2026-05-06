import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { Toaster } from 'react-hot-toast';
import Header from './components/Layout/Header';
import LogInteraction from './pages/LogInteraction';
import './styles/global.css';

function App() {
  return (
    <Provider store={store}>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Header />
        <main>
          <LogInteraction />
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              borderRadius: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } }
          }}
        />
      </div>
    </Provider>
  );
}

export default App;
