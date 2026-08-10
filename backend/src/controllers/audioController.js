import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { downloadAudio, validateYoutubeUrl, getVideoMetadata } from '../utils/ytDlpWrapper.js';
import { convertToM4r } from '../utils/ffmpegWrapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '../../temp');
const METADATA_FILE = path.join(TEMP_DIR, 'metadata.json');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Read/write metadata database for tracking downloaded videos
const getMetadataDb = () => {
  if (!fs.existsSync(METADATA_FILE)) {
    fs.writeFileSync(METADATA_FILE, JSON.stringify({}));
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
};

const saveMetadataDb = (db) => {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(db, null, 2));
};

/**
 * Downloads a video's audio from a YouTube URL
 */
export const downloadVideoAudio = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  if (!validateYoutubeUrl(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL format' });
  }

  try {
    const fileId = uuidv4();
    res.write(JSON.stringify({ status: 'fetching_metadata', message: 'Fetching video details...' }) + '\n');

    // Get metadata first
    const metadata = await getVideoMetadata(url);
    
    // Warn user if video is very long (>30 min) as download will take time
    const durationMinutes = Math.round(metadata.duration / 60);
    const sizeWarning = metadata.duration > 1800 ? ` (${durationMinutes} min video - this may take a while)` : '';
    res.write(JSON.stringify({ status: 'downloading', message: `Downloading audio for "${metadata.title}"...${sizeWarning}` }) + '\n');

    // Pass existing metadata to avoid duplicate yt-dlp call
    const result = await downloadAudio(url, TEMP_DIR, fileId, metadata);

    // Save metadata mapping
    const db = getMetadataDb();
    db[fileId] = {
      id: fileId,
      title: result.title,
      duration: result.duration,
      originalPath: result.filePath,
      createdAt: Date.now()
    };
    saveMetadataDb(db);

    res.write(JSON.stringify({
      status: 'complete',
      data: {
        id: fileId,
        title: result.title,
        duration: result.duration,
        audioUrl: `/api/audio/${fileId}`
      }
    }) + '\n');
    res.end();
  } catch (error) {
    console.error('Download audio route failed:', error);
    // Express res.write might have been called, so handle error response gracefully
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    } else {
      res.write(JSON.stringify({ status: 'error', error: error.message }) + '\n');
      res.end();
    }
  }
};

/**
 * Streams the intermediate audio file for wavesurfer
 */
export const streamAudioFile = (req, res) => {
  const { id } = req.params;
  const db = getMetadataDb();
  const fileInfo = db[id];

  if (!fileInfo || !fs.existsSync(fileInfo.originalPath)) {
    return res.status(404).json({ error: 'Audio file not found' });
  }

  // Stream file to client
  res.setHeader('Content-Type', 'audio/mpeg');
  const stream = fs.createReadStream(fileInfo.originalPath);
  stream.on('error', (err) => {
    console.error('Audio streaming failed:', err);
    if (!res.headersSent) {
      res.status(500).end();
    }
  });
  stream.pipe(res);
};

/**
 * Trims and converts the audio file to M4R
 */
export const createRingtone = async (req, res) => {
  const { id, start, duration, volume, fadeIn, fadeOut } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'File ID is required' });
  }

  const db = getMetadataDb();
  const fileInfo = db[id];

  if (!fileInfo || !fs.existsSync(fileInfo.originalPath)) {
    return res.status(404).json({ error: 'Original audio file not found' });
  }

  const startTime = parseFloat(start);
  const ringtoneDuration = parseFloat(duration);
  const volBoost = volume ? parseFloat(volume) : 1.0;
  const fIn = fadeIn ? parseFloat(fadeIn) : 0;
  const fOut = fadeOut ? parseFloat(fadeOut) : 0;

  if (isNaN(startTime) || startTime < 0 || startTime >= fileInfo.duration) {
    return res.status(400).json({ error: 'Invalid start time' });
  }

  if (isNaN(ringtoneDuration) || ringtoneDuration <= 0 || ringtoneDuration > 40) {
    return res.status(400).json({ error: 'Duration must be between 0 and 40 seconds' });
  }

  try {
    const ringtoneFilename = `${id}-ringtone.m4r`;
    const outputPath = path.join(TEMP_DIR, ringtoneFilename);

    await convertToM4r({
      inputPath: fileInfo.originalPath,
      outputPath,
      start: startTime,
      duration: ringtoneDuration,
      volume: volBoost,
      fadeIn: fIn,
      fadeOut: fOut
    });

    const safeTitle = fileInfo.title.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50) || 'ringtone';
    const downloadName = `${safeTitle}.m4r`;

    res.download(outputPath, downloadName, (err) => {
      if (err) {
        console.error('Ringtone download transmission error:', err);
      }
      
      // Attempt to clean up the ringtone file immediately after download completes/fails
      try {
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      } catch (cleanupErr) {
        console.error('Failed to delete temporary ringtone file:', cleanupErr);
      }
    });

  } catch (error) {
    console.error('Ringtone generation failed:', error);
    return res.status(500).json({ error: `Failed to generate ringtone: ${error.message}` });
  }
};

/**
 * Cleans up files older than cleanupAge (default 30 mins)
 */
export const cleanTempFiles = (cleanupAgeMs = 30 * 60 * 1000) => {
  try {
    const db = getMetadataDb();
    const now = Date.now();
    let dbUpdated = false;

    // Check files in temp directory
    const files = fs.readdirSync(TEMP_DIR);
    
    // Check files listed in the database
    for (const [id, info] of Object.entries(db)) {
      if (now - info.createdAt > cleanupAgeMs) {
        // Delete original file
        if (fs.existsSync(info.originalPath)) {
          fs.unlinkSync(info.originalPath);
        }
        
        // Delete any related ringtones that might have been left over
        const ringtonePath = path.join(TEMP_DIR, `${id}-ringtone.m4r`);
        if (fs.existsSync(ringtonePath)) {
          fs.unlinkSync(ringtonePath);
        }

        delete db[id];
        dbUpdated = true;
        console.log(`Cleaned up temp audio for key: ${id}`);
      }
    }

    // Also clean up any untracked .mp3 or .m4r files in the directory older than cleanupAgeMs
    for (const file of files) {
      if (file === 'metadata.json') continue;
      const filePath = path.join(TEMP_DIR, file);
      if (!fs.existsSync(filePath)) continue;
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > cleanupAgeMs) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up untracked file: ${file}`);
        }
      } catch (statErr) {
        console.error(`Failed to stat/unlink file ${file}:`, statErr);
      }
    }

    if (dbUpdated) {
      saveMetadataDb(db);
    }
  } catch (err) {
    console.error('Temp cleanup failed:', err);
  }
};
