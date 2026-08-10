import React, { useState } from 'react';
import { Smartphone, Laptop, CheckCircle, Info, Copy } from 'lucide-react';

export default function Instructions() {
  const [activeTab, setActiveTab] = useState('garageband');

  return (
    <div className="glass-panel animate-slide-up" style={{ padding: '32px', width: '100%', maxWidth: '850px', margin: '32px auto 0 auto' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📲 How to Install custom Ringtone on your iPhone
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
        Apple requires specific steps to add custom ringtones. Choose the method that works best for you:
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: '24px', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('garageband')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'garageband' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'garageband' ? 'var(--color-primary)' : 'var(--text-secondary)',
            padding: '12px 16px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Smartphone size={18} />
          GarageBand (No Computer)
        </button>
        <button
          onClick={() => setActiveTab('computer')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'computer' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'computer' ? 'var(--color-primary)' : 'var(--text-secondary)',
            padding: '12px 16px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Laptop size={18} />
          Finder / iTunes (Mac/PC)
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'garageband' ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', gap: '10px', background: 'rgba(14, 213, 201, 0.05)', border: '1px solid rgba(14, 213, 201, 0.15)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Info size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>This method uses the free Apple <strong>GarageBand</strong> app on your iPhone. It allows you to set the downloaded <code>.m4r</code> file as a ringtone directly from your phone without needing a computer.</span>
          </div>

          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
            <li>
              <strong>Save file to iPhone:</strong> Download the ringtone on your iPhone and save it to the <strong>Files</strong> app (under "iCloud Drive" or "On My iPhone").
            </li>
            <li>
              <strong>Get GarageBand:</strong> Download the free <a href="https://apps.apple.com/app/garageband/id408709785" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>GarageBand App</a> from the App Store.
            </li>
            <li>
              <strong>Create a new project:</strong> Open GarageBand, tap the <strong>+</strong> icon to create a new song, and select the <strong>Audio Recorder</strong> instrument (tap Voice or Instrument).
            </li>
            <li>
              <strong>Switch to Track View:</strong> Tap the <strong>Tracks View</strong> button (third icon from top-left, looks like vertical rectangles/bricks) to show empty audio tracks.
            </li>
            <li>
              <strong>Open Loop Browser:</strong> Tap the <strong>Loop Browser</strong> button (omega/loop icon at top-right) and select the <strong>Files</strong> tab.
            </li>
            <li>
              <strong>Import the ringtone:</strong> Tap "Browse items from the Files app" at the bottom, find your downloaded <code>.m4r</code> file, select it, then <strong>drag and drop</strong> the file onto your timeline as a track.
            </li>
            <li>
              <strong>Save project:</strong> Tap the top-left arrow down icon and choose <strong>My Songs</strong> to save your project.
            </li>
            <li>
              <strong>Export as Ringtone:</strong> Press and hold on your saved project (usually named "My Song"), select <strong>Share</strong>, then tap <strong>Ringtone</strong>.
            </li>
            <li>
              <strong>Set Ringtone:</strong> Name your ringtone (e.g. ToneTube Ringtone) and tap <strong>Export</strong>. When finished, select "Use sound as..." or find it in iPhone <strong>Settings &gt; Sounds &amp; Haptics &gt; Ringtone</strong>!
            </li>
          </ol>
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', gap: '10px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Info size={18} color="var(--color-indigo)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>This method uses a Mac or Windows PC to sync the ringtone. It is very fast and doesn't require installing any apps on your phone.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: '#fff' }}>🖥️ On macOS (Catalina, Big Sur, Monterey, Ventura, Sonoma, etc.):</h4>
              <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                <li>Connect your iPhone to your Mac using a USB/Lightning cable.</li>
                <li>Open <strong>Finder</strong> on your Mac.</li>
                <li>Click your **iPhone** name under "Locations" in the Finder sidebar. (Trust the device if prompted).</li>
                <li>Locate the downloaded <code>.m4r</code> ringtone file on your Mac.</li>
                <li><strong>Drag and drop</strong> the <code>.m4r</code> file directly onto the Finder window showing your iPhone screen.</li>
                <li>Open Settings on your iPhone, go to <strong>Sounds &amp; Haptics &gt; Ringtone</strong>. Your custom track will be at the very top!</li>
              </ol>
            </div>

            <div style={{ borderLeft: '3px solid var(--color-indigo)', paddingLeft: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: '#fff' }}>💻 On Windows PC or older macOS (Mojave and older):</h4>
              <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                <li>Connect your iPhone to your PC using a USB/Lightning cable.</li>
                <li>Open <strong>iTunes</strong> on your computer.</li>
                <li>Click the small **device icon** near the top left of iTunes.</li>
                <li>In the left sidebar of your device, click on **Tones** (or Ringtones).</li>
                <li><strong>Drag and drop</strong> your downloaded <code>.m4r</code> file directly into the empty Tones section.</li>
                <li>Sync your iPhone. The ringtone will now be available in iPhone <strong>Settings &gt; Sounds &amp; Haptics &gt; Ringtone</strong>!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
