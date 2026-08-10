import React, { useState } from 'react';
import UrlInput from './components/UrlInput';
import Editor from './components/Editor';
import Instructions from './components/Instructions';
import { Smartphone, Download, RefreshCw, Music, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState('input'); // input, loading, editing, converting, complete
  const [loadingStatus, setLoadingStatus] = useState({ status: '', message: '' });
  const [audioData, setAudioData] = useState(null); // { id, title, duration }
  const [downloadUrl, setDownloadUrl] = useState('');
  const [ringtoneTitle, setRingtoneTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle URL Submit and read streaming updates from API
  const handleUrlSubmit = async (url) => {
    setStep('loading');
    setErrorMsg('');
    setLoadingStatus({ status: 'fetching_metadata', message: 'Connecting to YouTube...' });

    try {
      const response = await fetch('http://localhost:5001/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server failed to analyze the video');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep remainder in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              
              if (data.status === 'fetching_metadata') {
                setLoadingStatus({ status: 'info', message: data.message });
              } else if (data.status === 'downloading') {
                setLoadingStatus({ status: 'download', message: data.message });
              } else if (data.status === 'complete') {
                setAudioData(data.data);
                setStep('editing');
              } else if (data.status === 'error') {
                throw new Error(data.error || 'Failed during processing');
              }
            } catch (err) {
              console.error('Chunk parsing failed:', err, line);
            }
          }
        }
      }
    } catch (error) {
      console.error('URL processing failed:', error);
      setErrorMsg(error.message || 'Something went wrong. Make sure the backend server is running.');
      setStep('input');
    }
  };

  // Trigger conversion and download result
  const handleConvert = async (settings) => {
    setStep('converting');
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:5001/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate ringtone');
      }

      // Read output file blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setRingtoneTitle(audioData.title);
      setStep('complete');

      // Auto-trigger the download
      const safeTitle = audioData.title.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50) || 'ringtone';
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeTitle}.m4r`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Ringtone conversion failed:', error);
      setErrorMsg(error.message || 'Failed to process ringtone. Please try again.');
      setStep('editing');
    }
  };

  const handleReset = () => {
    setStep('input');
    setAudioData(null);
    setDownloadUrl('');
    setRingtoneTitle('');
    setErrorMsg('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Navigation */}
      <header style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(9, 13, 22, 0.4)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={handleReset}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Music size={20} color="#000" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)', background: 'linear-gradient(90deg, #fff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ToneTube
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>iOS Ringtone Editor v1.0</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        
        {/* Global Error Banner */}
        {errorMsg && (
          <div className="glass-panel animate-slide-up" style={{
            maxWidth: '680px',
            width: '100%',
            padding: '16px 20px',
            background: 'rgba(255, 0, 127, 0.1)',
            borderColor: 'rgba(255, 0, 127, 0.3)',
            borderRadius: '12px',
            color: '#fff',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>An error occurred</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* State Machine Router */}
        {step === 'input' && (
          <UrlInput onSubmit={handleUrlSubmit} isLoading={false} />
        )}

        {step === 'loading' && (
          <div className="glass-panel animate-slide-up" style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'center', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <div className="spinner" style={{
              width: '60px',
              height: '60px',
              border: '3px solid rgba(14, 213, 201, 0.1)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '32px',
              boxShadow: '0 0 15px rgba(14, 213, 201, 0.15)'
            }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Extracting Audio Track</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {loadingStatus.message}
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '20px' }}>
              This may take up to a minute depending on the length of the video.
            </span>
          </div>
        )}

        {step === 'editing' && audioData && (
          <Editor
            audioId={audioData.id}
            title={audioData.title}
            duration={audioData.duration}
            onConvert={handleConvert}
            isConverting={false}
            onBack={handleReset}
          />
        )}

        {step === 'converting' && (
          <div className="glass-panel animate-slide-up" style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'center', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <RefreshCw size={48} className="spin" color="var(--color-primary)" style={{ marginBottom: '32px', filter: 'drop-shadow(0 0 8px var(--color-primary-glow))' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Cutting &amp; Encoding Ringtone</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              FFmpeg is trimming, applying fades, boosting volume, and packaging the audio into an iPhone-compatible AAC format...
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="glass-panel animate-slide-up" style={{ padding: '40px', maxWidth: '680px', width: '100%', textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{
                  background: 'rgba(14, 213, 201, 0.1)',
                  padding: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(14, 213, 201, 0.15)',
                  border: '1px solid rgba(14, 213, 201, 0.2)'
                }}>
                  <CheckCircle2 size={36} color="var(--color-primary)" />
                </div>
              </div>

              <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Ringtone Generated!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                Successfully generated and downloaded: <strong>{ringtoneTitle}</strong>
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <a href={downloadUrl} download={`${ringtoneTitle.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50)}.m4r`} className="btn-primary" style={{ textDecoration: 'none' }}>
                  <Download size={18} />
                  Download File Again
                </a>
                <button className="btn-secondary" onClick={handleReset}>
                  <ArrowLeft size={18} />
                  Create Another Tone
                </button>
              </div>
            </div>

            {/* Install instructions */}
            <Instructions />
          </div>
        )}

      </main>

      {/* Global CSS spinner rule */}
      <style dangerouslySetInnerHTML={{__html: `
        .spinner {
          animation: spin 1s linear infinite;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />

      {/* Footer */}
      <footer style={{
        padding: '30px 40px',
        borderTop: '1px solid var(--border-glass)',
        textAlign: 'center',
        background: 'rgba(9, 13, 22, 0.6)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginTop: 'auto'
      }}>
        <p>© 2026 ToneTube. Created with advanced audio processing.</p>
      </footer>
    </div>
  );
}
