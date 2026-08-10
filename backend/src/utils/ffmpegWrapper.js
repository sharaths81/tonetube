import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Cache the ffmpeg path after first discovery to avoid repeated checks
let cachedFfmpegPath = null;

// Find ffmpeg in standard paths
const getFfmpegPath = async () => {
  if (cachedFfmpegPath) return cachedFfmpegPath;
  
  const paths = [
    'ffmpeg',
    '/opt/homebrew/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/usr/bin/ffmpeg'
  ];

  for (const p of paths) {
    try {
      await execPromise(`"${p}" -version`);
      cachedFfmpegPath = p;
      return p;
    } catch (e) {
      // Continue checking
    }
  }
  throw new Error('ffmpeg not found on system. Please ensure it is installed.');
};

/**
 * Trims and converts an audio file to an iPhone compatible M4R file
 * @param {Object} options
 * @param {string} options.inputPath - Path to input audio (e.g. mp3)
 * @param {string} options.outputPath - Path to output m4r file
 * @param {number} options.start - Start time in seconds
 * @param {number} options.duration - Duration of ringtone in seconds (max 40)
 * @param {number} [options.volume=1.0] - Volume multiplier
 * @param {number} [options.fadeIn=0] - Fade-in duration in seconds
 * @param {number} [options.fadeOut=0] - Fade-out duration in seconds
 * @returns {Promise<string>} - Path to the created m4r file
 */
export const convertToM4r = async ({
  inputPath,
  outputPath,
  start,
  duration,
  volume = 1.0,
  fadeIn = 0,
  fadeOut = 0
}) => {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input audio file does not exist: ${inputPath}`);
  }

  const ffmpegPath = await getFfmpegPath();

  // Enforce iPhone ringtone limit of 40 seconds
  const finalDuration = Math.min(duration, 40);

  // Construct audio filters
  const audioFilters = [];

  if (volume !== 1.0 && volume > 0) {
    audioFilters.push(`volume=${volume.toFixed(2)}`);
  }

  if (fadeIn > 0) {
    audioFilters.push(`afade=t=in:ss=0:d=${fadeIn.toFixed(2)}`);
  }

  if (fadeOut > 0) {
    const fadeOutStart = Math.max(0, finalDuration - fadeOut);
    audioFilters.push(`afade=t=out:st=${fadeOutStart.toFixed(2)}:d=${fadeOut.toFixed(2)}`);
  }

  const filterString = audioFilters.length > 0 
    ? `-af "${audioFilters.join(',')}"` 
    : '';

  // Command to trim, apply filters, and convert to AAC (.m4r is basically .m4a renamed)
  // We use -y to overwrite, -ss [start] before -i for fast seeking
  // -c:a aac -b:a 192k for clean AAC audio
  // -f ipod is used for Apple compatibility (ensures MP4 container is tagged for iPod/iOS)
  const cmd = `"${ffmpegPath}" -y -ss ${start.toFixed(2)} -t ${finalDuration.toFixed(2)} -i "${inputPath}" ${filterString} -c:a aac -b:a 192k -f ipod "${outputPath}"`;

  try {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await execPromise(cmd);
    
    if (!fs.existsSync(outputPath)) {
      throw new Error('FFmpeg executed but output file was not created.');
    }

    return outputPath;
  } catch (error) {
    console.error('ffmpeg conversion failed:', error);
    throw new Error(`Failed to convert audio: ${error.message}`);
  }
};
