import app from './app.js';

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`ToneTube Backend running on port ${PORT}`);
  
  // Run an initial cleanup on startup
  import('./controllers/audioController.js').then(({ cleanTempFiles }) => {
    console.log('Running startup cleanup of old temp audio files...');
    cleanTempFiles(); // Clean all left-overs from previous runs
  }).catch(err => {
    console.error('Failed to run startup cleanup:', err);
  });
});
