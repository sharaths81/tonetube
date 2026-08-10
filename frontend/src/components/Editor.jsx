import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import { Play, Pause, Volume2, Scissors, RefreshCw, ZoomIn, Info } from 'lucide-react';

export default function Editor({ audioId, title, duration, onConvert, isConverting, onBack }) {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionsRef = useRef(null);
  const activeRegionRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(30); // pixels per second
  
  // Ringtone edit state
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(30, duration));
  const [fadeIn, setFadeIn] = useState(2);
  const [fadeOut, setFadeOut] = useState(2);
  const [volume, setVolume] = useState(1.0);

  const selectedDuration = endTime - startTime;

  // Initialize wavesurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(255, 255, 255, 0.12)',
      progressColor: 'rgba(14, 213, 201, 0.4)',
      cursorColor: '#ff007f',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 3,
      height: 128,
      responsive: true,
      minPxPerSec: zoom,
      fillParent: true
    });

    const wsRegions = ws.registerPlugin(RegionsPlugin.create());
    regionsRef.current = wsRegions;
    wavesurferRef.current = ws;

    // Load the audio from the backend stream
    ws.load(`http://localhost:5001/api/audio/${audioId}`);

    // Create the default 30-second region
    ws.on('ready', () => {
      const defaultEnd = Math.min(30, duration);
      const region = wsRegions.addRegion({
        id: 'ringtone-region',
        start: 0,
        end: defaultEnd,
        color: 'rgba(14, 213, 201, 0.25)',
        drag: true,
        resize: true
      });
      activeRegionRef.current = region;
      setStartTime(0);
      setEndTime(defaultEnd);
    });

    // Handle region resizing and dragging constraints
    wsRegions.on('region-updated', (region) => {
      let rStart = region.start;
      let rEnd = region.end;
      
      // Enforce 40s max duration limit
      if (rEnd - rStart > 40) {
        // Find which handle was moved
        if (Math.abs(rStart - startTime) > 0.01) {
          // Start was moved back, push end back to maintain 40s
          rEnd = rStart + 40;
        } else {
          // End was moved forward, pull start forward to maintain 40s
          rStart = rEnd - 40;
        }
        
        region.setOptions({
          start: Math.max(0, rStart),
          end: Math.min(duration, rEnd)
        });
      }

      setStartTime(region.start);
      setEndTime(region.end);
    });

    // Loop play within the selected region if play starts inside it
    ws.on('audioprocess', () => {
      if (activeRegionRef.current) {
        const current = ws.getCurrentTime();
        if (current >= activeRegionRef.current.end) {
          ws.seekTo(activeRegionRef.current.start / ws.getDuration());
        }
      }
    });

    // Sync play state
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    return () => {
      if (ws) {
        ws.destroy();
      }
    };
  }, [audioId]);

  // Handle Play/Pause
  const handlePlayPause = () => {
    if (!wavesurferRef.current) return;
    
    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      // Seek to start of region if playhead is outside the region
      const current = wavesurferRef.current.getCurrentTime();
      if (current < startTime || current > endTime) {
        wavesurferRef.current.seekTo(startTime / duration);
      }
      wavesurferRef.current.play();
    }
  };

  // Sync zoom changes
  const handleZoomChange = (e) => {
    const value = parseInt(e.target.value);
    setZoom(value);
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(value);
    }
  };

  // Sync manual start/end inputs
  const handleManualTimeChange = (newStart, newEnd) => {
    const startVal = Math.max(0, Math.min(duration, newStart));
    const endVal = Math.max(startVal, Math.min(duration, newEnd));

    const finalEndVal = Math.min(endVal, startVal + 40);

    setStartTime(startVal);
    setEndTime(finalEndVal);

    if (activeRegionRef.current) {
      activeRegionRef.current.setOptions({
        start: startVal,
        end: finalEndVal
      });
    }
  };

  const handleGenerate = () => {
    onConvert({
      id: audioId,
      start: startTime,
      duration: selectedDuration,
      volume,
      fadeIn,
      fadeOut
    });
  };

  // Helper formatting for durations
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms < 10 ? '0' : ''}${ms}`;
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ padding: '32px', width: '100%', maxWidth: '850px', margin: '0 auto' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Visual Audio Editor
          </span>
          <h2 style={{ fontSize: '1.4rem', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '550px' }} title={title}>
            {title}
          </h2>
        </div>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '10px 18px', fontSize: '0.875rem' }}>
          Back to URL
        </button>
      </div>

      {/* Waveform Container */}
      <div style={{ position: 'relative', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '16px', marginBottom: '24px' }}>
        <div id="waveform" ref={waveformRef} />
        
        {/* Playback Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Selected Region: {formatTime(startTime)} to {formatTime(endTime)}</span>
          <span>Original Duration: {formatTime(duration)}</span>
        </div>
      </div>

      {/* Primary Playback controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border-glass)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn-primary" 
            onClick={handlePlayPause}
            style={{ 
              borderRadius: '50%', 
              width: '56px', 
              height: '56px', 
              padding: 0, 
              boxShadow: isPlaying ? '0 0 20px rgba(14, 213, 201, 0.4)' : 'var(--shadow-neon-primary)' 
            }}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '4px' }} />}
          </button>
          
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: selectedDuration > 40 ? 'var(--color-secondary)' : '#fff' }}>
              {selectedDuration.toFixed(2)}s Selected
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {selectedDuration > 40 ? '⚠️ Exceeds 40s limit' : '✅ Compatible with iOS'}
            </div>
          </div>
        </div>

        {/* Zoom Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '220px' }}>
          <ZoomIn size={16} color="var(--text-muted)" />
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Waveform Zoom</label>
            <input 
              type="range" 
              min="10" 
              max="120" 
              value={zoom} 
              onChange={handleZoomChange} 
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '32px', textAlign: 'right' }}>{zoom}px</span>
        </div>
      </div>

      {/* Tuning Options Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Start / End Times Inputs */}
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scissors size={14} /> Trim Timing
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="start-time-input" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Start (s)</label>
              <input 
                id="start-time-input"
                type="number" 
                step="0.1" 
                min="0"
                max={duration}
                value={parseFloat(startTime.toFixed(2))}
                onChange={(e) => handleManualTimeChange(parseFloat(e.target.value) || 0, endTime)}
                style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="end-time-input" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>End (s)</label>
              <input 
                id="end-time-input"
                type="number" 
                step="0.1" 
                min="0"
                max={duration}
                value={parseFloat(endTime.toFixed(2))}
                onChange={(e) => handleManualTimeChange(startTime, parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Fades */}
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--color-primary)' }}>
            🎛️ Fade Effects
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Fade In</span>
                <span>{fadeIn.toFixed(1)}s</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.5" 
                value={fadeIn} 
                onChange={(e) => setFadeIn(parseFloat(e.target.value))} 
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Fade Out</span>
                <span>{fadeOut.toFixed(1)}s</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.5" 
                value={fadeOut} 
                onChange={(e) => setFadeOut(parseFloat(e.target.value))} 
              />
            </div>
          </div>
        </div>

        {/* Volume scaling */}
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Volume2 size={14} /> Volume Boost
          </h3>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>Scale Multiplier</span>
              <span>{volume.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.1" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              <span>Quiet</span>
              <span>Normal</span>
              <span>Loud</span>
            </div>
          </div>
        </div>

      </div>

      {/* Info Notice about iPhone Ringtone Requirements */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        background: 'rgba(99, 102, 241, 0.05)', 
        border: '1px solid rgba(99, 102, 241, 0.15)', 
        borderRadius: '10px', 
        padding: '12px 16px', 
        marginBottom: '32px' 
      }}>
        <Info size={20} color="var(--color-indigo)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          <strong>iPhone Requirement:</strong> Custom ringtones must be <strong>under 40 seconds</strong>. Our trimmer enforces this limit automatically. Fades are highly recommended to ensure the ringtone sounds clean when looping.
        </p>
      </div>

      {/* Action Button */}
      <button 
        className="btn-primary" 
        onClick={handleGenerate}
        disabled={isConverting || selectedDuration <= 0}
        style={{ width: '100%', padding: '16px', fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-indigo) 100%)' }}
      >
        {isConverting ? (
          <>
            <RefreshCw size={20} className="spin" style={{ marginRight: '8px' }} />
            <span>Processing Ringtone on Server...</span>
          </>
        ) : (
          'Export Ringtone (.m4r)'
        )}
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
}
