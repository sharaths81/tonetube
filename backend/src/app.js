import express from 'express';
import cors from 'cors';
import { downloadVideoAudio, streamAudioFile, createRingtone, cleanTempFiles } from './controllers/audioController.js';

const app = express();

// Configure CORS to support local development port (default Vite is 5173)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// API Endpoints
app.post('/api/download', downloadVideoAudio);
app.get('/api/audio/:id', streamAudioFile);
app.post('/api/convert', createRingtone);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Periodic cleanup: run every 10 minutes, cleaning files older than 30 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000;
setInterval(() => {
  console.log('Running periodic cleanup of temp audio files...');
  cleanTempFiles();
}, CLEANUP_INTERVAL);

// Express Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error occurred' });
  }
});

export default app;
