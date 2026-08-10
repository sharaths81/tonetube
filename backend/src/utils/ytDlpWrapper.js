import { exec, execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Cache the yt-dlp path after first discovery to avoid repeated checks
let cachedYtDlpPath = null;

// Help find yt-dlp in standard directories if it's not in the PATH of the Node process
const getYtDlpPath = async () => {
  if (cachedYtDlpPath) return cachedYtDlpPath;
  
  const paths = [
    'yt-dlp',
    '/opt/homebrew/bin/yt-dlp',
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp'
  ];

  for (const p of paths) {
    try {
      await execPromise(`"${p}" --version`);
      cachedYtDlpPath = p;
      return p;
    } catch (e) {
      // Continue checking
    }
  }
  throw new Error('yt-dlp not found on system. Please ensure it is installed.');
};

/**
 * Validates a YouTube URL
 * @param {string} url 
 * @returns {boolean}
 */
export const validateYoutubeUrl = (url) => {
  if (!url) return false;
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([^&=%\?]{11})/;
  return regex.test(url);
};

/**
 * Gets video metadata (title, duration)
 * @param {string} url 
 * @returns {Promise<{title: string, duration: number}>}
 */
export const getVideoMetadata = async (url) => {
  if (!validateYoutubeUrl(url)) {
    throw new Error('Invalid YouTube URL');
  }

  const ytDlpPath = await getYtDlpPath();
  const cmd = `"${ytDlpPath}" --dump-json --no-playlist "${url}"`;
  
  try {
    const { stdout } = await execPromise(cmd, { maxBuffer: 1024 * 1024 * 10 });
    const info = JSON.parse(stdout);
    return {
      title: info.title || 'Unknown Video',
      duration: info.duration || 0
    };
  } catch (error) {
    console.error('yt-dlp metadata extraction failed:', error);
    throw new Error(`Failed to extract metadata: ${error.message}`);
  }
};

/**
 * Downloads audio from a YouTube URL
 * @param {string} url 
 * @param {string} outputDir 
 * @param {string} filename (without extension)
 * @returns {Promise<{filePath: string, title: string, duration: number}>}
 */
export const downloadAudio = async (url, outputDir, filename, existingMetadata = null) => {
  if (!validateYoutubeUrl(url)) {
    throw new Error('Invalid YouTube URL');
  }

  const ytDlpPath = await getYtDlpPath();
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputTemplate = path.join(outputDir, `${filename}.%(ext)s`);
  // Download audio and convert to mp3 - use concurrent fragment downloads for speed
  const cmd = `"${ytDlpPath}" -x --audio-format mp3 --audio-quality 192k -o "${outputTemplate}" --no-playlist --concurrent-fragments 4 "${url}"`;

  try {
    // Use existing metadata if provided to avoid duplicate yt-dlp call
    const metadata = existingMetadata || await getVideoMetadata(url);
    
    // Perform download
    await execPromise(cmd, { maxBuffer: 1024 * 1024 * 50 });
    
    // Verify file exists (yt-dlp will save it as filename.mp3)
    const expectedFilePath = path.join(outputDir, `${filename}.mp3`);
    if (!fs.existsSync(expectedFilePath)) {
      // Find what file was actually created in case format was different
      const files = fs.readdirSync(outputDir);
      const match = files.find(f => f.startsWith(filename));
      if (match) {
        return {
          filePath: path.join(outputDir, match),
          title: metadata.title,
          duration: metadata.duration
        };
      }
      throw new Error('Downloaded audio file not found');
    }

    return {
      filePath: expectedFilePath,
      title: metadata.title,
      duration: metadata.duration
    };
  } catch (error) {
    console.error('yt-dlp download failed:', error);
    throw new Error(`Failed to download YouTube audio: ${error.message}`);
  }
};
