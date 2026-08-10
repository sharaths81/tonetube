import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.URL.createObjectURL
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost:5173/mock-uuid');
}

// Mock WaveSurfer and its plugins
vi.mock('wavesurfer.js', () => {
  const mockWaveSurferInstance = {
    load: vi.fn(),
    on: vi.fn((event, callback) => {
      // Simulate calling 'ready' to initialize region times in components
      if (event === 'ready') {
        setTimeout(callback, 0);
      }
      return mockWaveSurferInstance;
    }),
    destroy: vi.fn(),
    zoom: vi.fn(),
    getCurrentTime: vi.fn(() => 0),
    getDuration: vi.fn(() => 180),
    seekTo: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    registerPlugin: vi.fn(() => {
      return {
        addRegion: vi.fn(() => ({
          id: 'ringtone-region',
          start: 0,
          end: 30,
          setOptions: vi.fn()
        })),
        on: vi.fn()
      };
    })
  };

  return {
    default: {
      create: vi.fn(() => mockWaveSurferInstance)
    }
  };
});

vi.mock('wavesurfer.js/dist/plugins/regions.js', () => {
  return {
    default: {
      create: vi.fn(() => ({
        // Mock plugin creator
      }))
    }
  };
});
