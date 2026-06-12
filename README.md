# ToneTube - YouTube to iPhone Ringtone Converter & Editor

ToneTube is a modern, full-stack web application designed to convert any YouTube music audio into a custom iPhone-compatible ringtone (`.m4r` format). 

It features an interactive waveform editor powered by `wavesurfer.js` which lets you select any segment of the audio (up to the iOS limit of 40 seconds), adjust the volume, and apply fade-in and fade-out effects to ensure smooth transitions.

It also provides comprehensive instructions on how to load the exported file to your iPhone using **GarageBand** (no computer required) or **Finder/iTunes**.

---

## 🛠️ Project Structure

The project is structured as a monorepo using npm workspaces:

```
tonetube/
├── package.json         # Monorepo configuration and workspace scripts
├── README.md            # Project documentation (this file)
├── backend/             # Express.js backend for downloading & processing audio
│   ├── src/
│   │   ├── app.js       # Express app configuration & middlewares
│   │   ├── server.js    # Entrypoint to start the API server
│   │   ├── controllers/
│   │   │   └── audioController.js  # Download, trim, and stream routes
│   │   └── utils/
│   │       ├── ytDlpWrapper.js     # Executes yt-dlp to download YouTube audio
│   │       └── ffmpegWrapper.js    # Executes ffmpeg for audio edits and conversions
│   └── tests/
│       ├── setup.js     # Jest test environment hooks
│       └── audio.test.js # API and utility integration tests
└── frontend/            # Vite + React frontend application
    ├── index.html       # Single Page Application HTML shell
    ├── vite.config.js   # Vite configuration with Vitest setup
    ├── src/
    │   ├── main.jsx     # App entrypoint
    │   ├── index.css    # Premium Vanilla CSS dark glassmorphic styles
    │   ├── App.jsx      # Root component managing application states
    │   ├── setupTests.js # Vitest test configuration & WaveSurfer mocks
    │   └── components/
    │       ├── UrlInput.jsx      # YouTube URL validator & downloader panel
    │       ├── Editor.jsx        # Waveform trim, fade, volume editor
    │       ├── Instructions.jsx  # Tabs for GarageBand / iTunes guides
    │       └── UrlInput.test.jsx
    │       └── Editor.test.jsx
    │       └── Instructions.test.jsx
```

---

## 🚀 Getting Started

### 1. System Prerequisites

The application utilizes system-level commands to perform downloads and conversions:

*   **`ffmpeg`**: Required to seek, trim, scale volume, apply fades, and encode audio into an AAC `.m4r` file.
*   **`yt-dlp`**: Highly reliable downloader to stream and extract audio directly from YouTube URLs.

#### Installation on macOS:
Ensure you have Homebrew installed, then run:
```bash
brew install ffmpeg yt-dlp
```

### 2. Node Installation

From the project root directory, run:
```bash
npm install
```
This single command installs all dependencies for both the root monorepo, the backend Express server, and the frontend React application.

### 3. Running the App

To run both backend (port `5001`) and frontend (port `5173`) in development mode concurrently, execute:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

Both backend and frontend codebases have fully configured automated test suites.

### Running Backend Tests
The backend uses **Jest** with `supertest` for integration testing. We test routing behaviors, error handling, metadata validation, audio streaming, and M4R conversions under mock environments to ensure speed and consistency:
```bash
npm run test:backend
```

### Running Frontend Tests
The frontend uses **Vitest** and **React Testing Library** under a `jsdom` environment. The waveforms and web audio contexts are fully mocked to verify UI responses, validation error messages, inputs, and button events:
```bash
npm run test:frontend
```

### Running All Tests
To run both test suites sequentially:
```bash
npm run test
```

---

## 📡 Backend API Reference

### 1. `POST /api/download`
Downloads YouTube audio and stores it as an intermediate MP3.
*   **Request Body**:
    ```json
    { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
    ```
*   **Response**: Streams JSON lines chunk-by-chunk representing progress, finishing with a JSON response containing metadata:
    ```json
    {
      "status": "complete",
      "data": {
        "id": "a90f1d2c-8067-47b2-bd77-1c9f872b2201",
        "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
        "duration": 212,
        "audioUrl": "/api/audio/a90f1d2c-8067-47b2-bd77-1c9f872b2201"
      }
    }
    ```

### 2. `GET /api/audio/:id`
Streams the intermediate MP3 audio file to the client for loading into `wavesurfer.js`.
*   **Headers**: `Content-Type: audio/mpeg`

### 3. `POST /api/convert`
Trims, applies audio edits (volume scaling, fade-in/out), converts to AAC inside an MP4 iPod container, and sends it as a `.m4r` attachment.
*   **Request Body**:
    ```json
    {
      "id": "a90f1d2c-8067-47b2-bd77-1c9f872b2201",
      "start": 10.5,
      "duration": 30.0,
      "volume": 1.5,
      "fadeIn": 2.0,
      "fadeOut": 2.0
    }
    ```
*   **Response**: Attachment download `.m4r` file.

### 4. Temporary File Cleanup
The backend maintains a SQLite-free temporary metadata mapping. On server start, and at **10-minute intervals**, a background cleaner automatically deletes all temporary intermediate audio files and generated ringtones that are older than **30 minutes** to safeguard local disk space.

---

## 📱 How to Set as iPhone Ringtone

Since iPhones do not natively support direct `.m4r` imports from the Safari browser, you must transfer it using one of two methods:

### Method A: GarageBand App (No Computer Required)
*This is the best way to load the ringtone directly on your iPhone.*

1.  **Save the file:** Download the `.m4r` from ToneTube on your iPhone. Tap download and choose **Save to Files** (select iCloud Drive or "On My iPhone").
2.  **Open GarageBand:** Download and launch the free **GarageBand** app from the App Store.
3.  **New Song:** Tap the **+** button. Scroll to find **Audio Recorder** and tap on it.
4.  **Track View:** Tap the **Tracks View** icon (the third icon from the top-left, resembling a brick wall) to show the horizontal multitrack editor.
5.  **Loop Browser:** Tap the **Loop Browser** icon (resembling a loop/ribbon in the top-right corner).
6.  **Import File:** Select the **Files** tab at the top. Tap **"Browse items from the Files app"** at the bottom, find your downloaded `.m4r` file, and select it.
7.  **Place on Timeline:** Hold down on the imported file in the list and **drag it onto the track timeline**.
8.  **Save Project:** Tap the down-arrow icon in the top-left corner and select **My Songs** to save the track.
9.  **Export Ringtone:** Long-press your song file, select **Share**, then choose **Ringtone**.
10. **Apply:** Name your ringtone, tap **Export**, and select **Use sound as...** or navigate to iPhone **Settings > Sounds & Haptics > Ringtone** to set it!

### Method B: Finder or iTunes (Mac / PC)
*If you have a computer, this takes less than 30 seconds.*

#### On macOS Catalina or newer:
1.  Connect your iPhone to your Mac using a USB/Lightning cable.
2.  Open **Finder** and select your **iPhone** in the left sidebar under *Locations*.
3.  Locate your downloaded `.m4r` file in Finder.
4.  **Drag and drop** the `.m4r` file directly onto the Finder window showing your iPhone details.
5.  On your iPhone, open **Settings > Sounds & Haptics > Ringtone**. The new tone will appear at the top.

#### On Windows or macOS Mojave and older:
1.  Connect your iPhone to your PC and open **iTunes**.
2.  Click the small **device icon** in the top-left of the iTunes window.
3.  Select **Tones** in the left sidebar under *On My Device*.
4.  **Drag and drop** the `.m4r` file from your computer folder directly into the iTunes Tones list.
5.  Sync your iPhone, then set the ringtone via your iPhone Settings.
# tonetube
