import React, { useState } from 'react';
import { Youtube, Search, AlertCircle } from 'lucide-react';

export default function UrlInput({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (value) => {
    if (!value.trim()) {
      return 'URL is required';
    }
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([^&=%\?]{11})/;
    if (!regex.test(value)) {
      return 'Please enter a valid YouTube URL (e.g., youtube.com/watch?v=...)';
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    onSubmit(url.trim());
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ padding: '40px', maxWidth: '680px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{
          background: 'rgba(255, 0, 127, 0.1)',
          padding: '16px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(255, 0, 127, 0.15)',
          border: '1px solid rgba(255, 0, 127, 0.2)'
        }}>
          <Youtube size={36} color="#ff007f" />
        </div>
      </div>

      <h2 style={{ textAlign: 'center', fontSize: '1.75rem', marginBottom: '12px' }}>
        Convert YouTube to Ringtone
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem', lineHeight: '1.5' }}>
        Paste any YouTube music video URL below. We will extract the audio and let you visually edit, trim, and add fades to create your custom iPhone ringtone.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type="text"
            className="glass-input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            disabled={isLoading}
            style={{ paddingRight: '50px' }}
          />
          <div style={{
            position: 'absolute',
            right: '18px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }}>
            <Search size={20} />
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--color-secondary)',
            fontSize: '0.875rem',
            marginBottom: '20px',
            background: 'rgba(255, 0, 127, 0.05)',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 0, 127, 0.1)'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary pulse-glow"
          disabled={isLoading}
          style={{ width: '100%', padding: '16px' }}
        >
          {isLoading ? (
            <>
              <div className="spinner" style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(0,0,0,0.1)',
                borderTopColor: '#000',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginRight: '8px'
              }} />
              <span>Analyzing Video...</span>
            </>
          ) : (
            'Extract Audio & Edit'
          )}
        </button>
      </form>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
