import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, '../temp');

// Mock utilities before importing app.js
jest.unstable_mockModule('../src/utils/ytDlpWrapper.js', () => {
  return {
    validateYoutubeUrl: (url) => {
      if (!url) return false;
      return url.includes('youtube.com') || url.includes('youtu.be');
    },
    getVideoMetadata: async (url) => {
      if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        throw new Error('Invalid YouTube URL');
      }
      return { title: 'Test YouTube Track', duration: 180 };
    },
    downloadAudio: async (url, outputDir, filename) => {
      // Create a dummy file to represent the downloaded audio
      const dummyPath = path.join(outputDir, `${filename}.mp3`);
      fs.writeFileSync(dummyPath, 'dummy MP3 audio content');
      return {
        filePath: dummyPath,
        title: 'Test YouTube Track',
        duration: 180
      };
    }
  };
});

jest.unstable_mockModule('../src/utils/ffmpegWrapper.js', () => {
  return {
    convertToM4r: async ({ inputPath, outputPath }) => {
      // Create a dummy file to represent the converted ringtone
      fs.writeFileSync(outputPath, 'dummy M4R ringtone content');
      return outputPath;
    }
  };
});

// Import the app and supertest after mocks are established
const { default: app } = await import('../src/app.js');
const { default: request } = await import('supertest');

describe('ToneTube API Integration Tests', () => {
  
  describe('GET /api/health', () => {
    it('should return 200 OK and health status', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('POST /api/download', () => {
    it('should fail if URL is missing', async () => {
      const response = await request(app)
        .post('/api/download')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'YouTube URL is required');
    });

    it('should fail if URL is invalid', async () => {
      const response = await request(app)
        .post('/api/download')
        .send({ url: 'https://google.com' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid YouTube URL format');
    });

    it('should download audio and return stream chunks for valid URL', async () => {
      const response = await request(app)
        .post('/api/download')
        .send({ url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' });
      
      expect(response.status).toBe(200);
      // Since it's streaming chunks, verify that metadata exists in output
      expect(response.text).toContain('fetching_metadata');
      expect(response.text).toContain('downloading');
      expect(response.text).toContain('complete');
      expect(response.text).toContain('Test YouTube Track');
    });
  });

  describe('GET /api/audio/:id and POST /api/convert', () => {
    let fileId;

    beforeEach(async () => {
      // Pre-populate a download to get a valid fileId
      const response = await request(app)
        .post('/api/download')
        .send({ url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' });
      
      // Extract the complete block JSON to find the ID
      const lines = response.text.trim().split('\n');
      const completeLine = JSON.parse(lines[lines.length - 1]);
      fileId = completeLine.data.id;
    });

    it('should stream the intermediate file', async () => {
      const response = await request(app).get(`/api/audio/${fileId}`);
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('audio/mpeg');
      expect(response.body.toString()).toBe('dummy MP3 audio content');
    });

    it('should return 404 for non-existent file ID', async () => {
      const response = await request(app).get('/api/audio/non-existent-id');
      expect(response.status).toBe(404);
    });

    it('should successfully convert and send ringtone download file', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          id: fileId,
          start: 10,
          duration: 30,
          volume: 1.5,
          fadeIn: 2,
          fadeOut: 2
        });

      expect(response.status).toBe(200);
      expect(response.header['content-disposition']).toContain('attachment');
      expect(response.header['content-disposition']).toContain('Test_YouTube_Track.m4r');
      expect(response.body.toString()).toBe('dummy M4R ringtone content');
    });

    it('should fail conversion with invalid parameters', async () => {
      // Test duration out of bounds (> 40s)
      let response = await request(app)
        .post('/api/convert')
        .send({
          id: fileId,
          start: 10,
          duration: 45
        });
      expect(response.status).toBe(400);

      // Test start time negative
      response = await request(app)
        .post('/api/convert')
        .send({
          id: fileId,
          start: -5,
          duration: 20
        });
      expect(response.status).toBe(400);
    });
  });
});
