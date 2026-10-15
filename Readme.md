# FabTune - Material 3 Music Player & Android App

[![Android](https://img.shields.io/badge/Android-APK%20v1.0.0-3DDC84?style=flat&logo=android&logoColor=white)](/FabTune.apk)
[![Target SDK](https://img.shields.io/badge/Target%20SDK-34%20(Android%2014)-blue)](/apk.exp)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.0-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An elegant, high-performance music streaming client and audio player engineered with Google's Material 3 design philosophy. FabTune features a realistic vinyl turntable player mode, synchronized real-time lyrics, a 10-band graphic equalizer with studio presets, yearly Wrapped listening analytics, custom playlist curation, and a standalone installable Android APK (`FabTune.apk`).

---

## 📑 Table of Contents

- [Features](#-features)
- [Android APK Installation & Sideloading](#-android-apk-installation--sideloading)
- [Version Export Specification (apk.exp)](#-version-export-specification-apkexp)
- [Tech Stack & Architecture](#-tech-stack--architecture)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Server API & Distribution Endpoints](#-server-api--distribution-endpoints)
- [License](#-license)

---

## ✨ Features

### 🎛 1. Vinyl Turntable Player Mode
- **Realistic Turntable Physics**: Smooth tonearm drop and lift animations synced directly with playback state.
- **Dynamic Vinyl Grooves**: Center label art rendered dynamically from track artwork with reflective vinyl sheen.
- **RPM Speed Controls**: Switch between 33⅓ RPM and 45 RPM rotation speeds.
- **Vinyl Audio Character**: Optional vintage crackle and needle drop audio effects for an authentic analog listening session.

### 🎤 2. Synchronized Real-Time Lyrics
- **Karaoke Syllable Sync**: Live line-by-line and syllable-level lyric tracking.
- **Auto-Scroll Engine**: Fluid, centered scrolling keeping the active lyric in optimal reading position.
- **Interactive Lyric Seeking**: Tap on any lyric line to instantly scrub playback to that exact timestamp.

### 📊 3. 10-Band Graphic Equalizer & Sound Enhancement
- **Precision Audio Processing**: Built with the Web Audio API (`BiquadFilterNode` chain).
- **10 Frequency Bands**: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, and 16kHz.
- **Audio Presets**: Pre-configured acoustic profiles including *Flat*, *Bass Boost*, *Vocal Clarity*, *Electronic*, *Rock*, *Hip-Hop*, *Studio Reference*, *Jazz*, and *Acoustic*.
- **Real-Time Visualizer**: Dual-channel frequency spectrum analyzer rendered smoothly at 60 FPS.

### 🎨 4. Material 3 Design System
- **Dynamic Palette**: Accent colors adaptively sampled from the active album cover art.
- **Surface Elevation & Blur**: Frosted glass backdrops, subtle border contours, and refined typographic contrast.
- **Zero-Pill Discipline & Viewport Presence**: Structured responsive layouts optimized for mobile handsets, tablets, and desktop displays.

### 🔍 5. Music Discovery & Smart Exploration
- **Curated Charts**: Global Top 50, Viral Hits, New Releases, and Mood Radio.
- **Press-Enter Instant Search**: Query YouTube Music and local tracks instantly by typing and pressing <kbd>Enter ↵</kbd>, with live suggestion keyboard navigation (↑/↓) and quick filter chips.
- **Related Recommendations**: Dynamic queue suggestions based on current playback context.

### 📈 6. FabTune Wrapped Listening Analytics
- **Personalized Yearly Recap**: Comprehensive breakdown of total listening time, top artists, favorite tracks, and genre distribution.
- **Shareable Visual Cards**: Beautiful confetti-animated summary cards for exporting and sharing.

### 📱 7. Standalone Android APK & PWA Capabilities
- **Native Android APK (`FabTune.apk`)**: Pre-compiled and signed package ready for instant sideloading on Android 11 through Android 15+.
- **Full Offline Fallback**: Bundled offline player engine ensures playback functionality even without network connectivity.

### 🎧 8. Background Playback & Screen-Lock Audio Engine
- **Uninterrupted Home & Background Play**: Music continues streaming seamlessly when navigating to the phone home screen, switching between apps, or browsing other tabs.
- **Screen-Lock Playback**: Keeps playing through phone screen lock and standby mode without throttling or stopping.
- **Mobile Audio Session Keep-Alive**: Uses a persistent audio carrier and Web Audio `MediaStreamDestination` to prevent mobile OS battery optimizers from suspending the audio daemon.
- **Lookahead Web Audio Scheduler & Web Worker Clock**: Employs an isolated Web Worker clock and pre-scheduling queue (1.2s lookahead) to eliminate timer stutter caused by OS background throttling.
- **Lock-Screen Media Controls**: Full MediaSession API integration providing lock-screen cover art, track info, play/pause, next/previous track, and ±10s seek controls on lock screens, notifications, dynamic islands, smartwatches, and bluetooth headsets.
- **Screen Wake Lock API**: Optional toggle in Settings to keep the display awake during immersive vinyl turntable and lyrics sessions.

### 🔀 9. 3x3 Shuffling Phase Matrix & Audio Immersion Studio
- **3x3 Shuffling Play Card Phase**: A responsive 9-card discovery grid on the home screen with a master 'Reshuffle Deck' button (spinning shuffle animation) and 'Play Phase' queue action.
- **3-Track Vertical Play Bar**: Three sleek horizontal bars displaying recently played tracks with live streaming equalizer indicators, time-stamps, like/queue shortcuts, and instant one-tap playback resume.
- **Audio Vibe & Tempo Warper**: One-tap realtime sound transformations including Nightcore (1.25x tempo + crisp treble), Slowed & Reverb (0.85x tempo + deep bass), Vinyl Lo-Fi Warmth, and Bass Cannon 8D.
- **Procedural Ambient Immersion Mixer**: Four offline Web Audio ambient generators (Midnight Rain, Vinyl Cafe, Forest Pine Breeze, and Cosmic Drone) that can be mixed at custom volumes beneath active music playback.
- **Quick Studio Launchers**: Fast one-touch sleep timer buttons (15m, 30m, 45m, 60m), direct Vinyl Studio launcher, and Karaoke Synchronized Lyrics mode.

---

## 📱 Android APK Installation & Sideloading

FabTune is packaged as a ready-to-install Android application package (`FabTune.apk`). You can install it on any device running **Android 11 (API 30)** or higher.

### Method A: Direct Web Download
1. On your Android phone, visit the app URL or tap the **"Get APK"** button in the bottom navigation bar.
2. Direct download links:
   - Primary: `https://<your-host>/FabTune.apk`
   - Alternate: `https://<your-host>/downloads/FabTune.apk`
   - API route: `https://<your-host>/api/download/apk`
3. When the download completes, tap the download notification or open your **Files / Downloads** folder.
4. Tap **FabTune.apk** to begin installation.

### Method B: QR Code Scan
1. Open FabTune on your desktop or laptop.
2. Click **"Get APK"** or open **Settings > Android APK**.
3. Point your Android phone camera at the QR code displayed on screen.
4. Tap the link banner to begin the download directly onto your handset.

### Sideloading Instructions by Brand

#### Samsung Galaxy (One UI)
1. Open the downloaded `FabTune.apk`.
2. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings**.
3. Toggle the switch next to **My Files** or **Chrome** to **On**.
4. Press the back button and tap **Install**.

#### Xiaomi / Redmi / POCO (HyperOS / MIUI)
1. Open `FabTune.apk` from the Downloads notification or File Manager.
2. On the security prompt, tap **Settings**.
3. Check **"I am aware of possible risks"** and wait for the 10-second safety counter.
4. Tap **OK**, return to the installer, and tap **Install**.

#### Google Pixel / Motorola / Stock Android (AOSP)
1. Tap `FabTune.apk` in Chrome or Files by Google.
2. On the warning prompt, tap **Settings**.
3. Enable **"Allow from this source"**.
4. Tap **Install** to complete setup.

---

## 📋 Version Export Specification (`apk.exp`)

The program includes an official version export specification file (`apk.exp` / `version.apk.exp`) capturing all release metadata, cryptographic hashes, and Android toolchain configurations.

### Key Release Parameters in `apk.exp`:

| Property | Value | Description |
| :--- | :--- | :--- |
| **Application Name** | `FabTune Player` | Android display label |
| **Package Name** | `com.webview.myapplication` | Application package identifier |
| **Version Name** | `1.0.0` | Semantic user-facing version |
| **Version Code** | `1` | Integer Android build number |
| **Minimum SDK** | `30` | Android 11.0 (Red Velvet Cake) |
| **Target SDK** | `34` | Android 14.0 (Upside Down Cake) |
| **Compile SDK** | `34` | Build toolchain target |
| **File Name** | `FabTune.apk` | Binary distribution file |
| **File Size** | `1,370,734 bytes (~1.31 MB)` | Compact optimized footprint |
| **SHA-256 Checksum** | `8732f48b51a61b5435495166f63862fa8ed478da3e638cd43c093550d1cb7ae2` | Package integrity hash |
| **SHA-1 Checksum** | `a8fc625c18d4dc3a575cabc2bc6159febe92f94d` | Legacy verification digest |
| **MD5 Checksum** | `2428122ecb55f68500dc7ffb98d45621` | Quick digest verification |
| **Signatures** | `v1 (JAR), v2 (Full APK), v3 (Rotation)` | Android APK Signature Schemes |
| **Signing Status** | `VERIFIED_SUCCESSFUL` | Verified via `apksigner verify` |

Access the raw specification:
```bash
# View the local file
cat apk.exp

# Or retrieve it via HTTP
curl http://localhost:3000/apk.exp
```

---

## 🛠 Tech Stack & Architecture

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite 8](https://vitejs.dev/) with `@tailwindcss/vite`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Motion & Animations**: [Motion](https://motion.dev/) (Framer Motion)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio Processing**: Web Audio API (`AudioContext`, `BiquadFilterNode`, `AnalyserNode`)
- **Backend Server**: [Express 4](https://expressjs.com/) with Vite dev middleware
- **Android Toolchain**: `aapt`, `zipalign`, and `apksigner` with custom packaging automation (`scripts/build-apk.py`)

---

## 📂 Project Directory Structure

```text
├── apk.exp                      # Android APK version & export metadata specification
├── version.apk.exp              # Version export alias
├── Readme.md                    # Project documentation (this file)
├── index.html                   # Single-Page Application entry point
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies and script definitions
├── server.ts                    # Express backend server, audio proxy & APK endpoints
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite bundler and plugin configuration
├── public/
│   ├── FabTune.apk              # Signed production Android APK binary (1.31 MB)
│   ├── apk.exp                  # Web-accessible version specification
│   ├── manifest.json            # PWA web app manifest
│   ├── icon.svg                 # Vector app icon
│   └── icons/                   # Multi-resolution launcher icons
├── scripts/
│   └── build-apk.py             # Android APK compilation, zipalign & apksigner script
└── src/
    ├── App.tsx                  # Synthesized application orchestrator & layout
    ├── main.tsx                 # React DOM mount point
    ├── index.css                # Global styles and Tailwind v4 imports
    ├── types/
    │   └── music.ts             # TypeScript interfaces for music, lyrics, playlists, themes
    ├── data/
    │   └── musicData.ts         # Initial offline fallback tracks, presets and playlists
    ├── hooks/
    │   ├── useMusicPlayer.ts    # Synthesized audio playback, queue & recommendations
    │   ├── useKeyboardShortcuts.ts # Global keybindings & HUD toast notifications
    │   ├── useSleepTimer.ts     # Sleep timer countdown with auto-pause
    │   ├── useOnlineStatus.ts   # Browser connectivity detection
    │   └── usePWAInstall.ts     # PWA deferred install prompt lifecycle
    ├── components/
    │   ├── common/              # Cover art display & keyboard shortcut HUD toasts
    │   ├── navigation/          # HeaderNav top bar & MobileNavBar 4-column dock
    │   ├── player/              # MiniPlayer, FullPlayerModal, Equalizer, Turntable
    │   ├── pwa/                 # OfflineIndicator, PWAInstallButton
    │   ├── views/               # HomeView, ExploreView, LibraryView, SearchView
    │   └── wrapped/             # Yearly Wrapped music stats & interactive stories
    └── services/
        ├── audioEngine.ts       # Web Audio API engine & synthesizer DSP nodes
        └── mediaSession.ts      # Native lockscreen & notification media controls
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- *(Optional for rebuilding APK)*: Python 3, `aapt`, `zipalign`, and `apksigner`

### Installation & Run

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

3. **Build the production web bundle**:
   ```bash
   npm run build
   ```

4. **Re-build the Android APK**:
   ```bash
   npm run build:apk
   ```

5. **Run TypeScript lint check**:
   ```bash
   npm run lint
   ```

---

## 🌐 Server API & Distribution Endpoints

| Route | Method | Description | Content-Type |
| :--- | :--- | :--- | :--- |
| `/FabTune.apk` | `GET` | Primary Android APK download | `application/vnd.android.package-archive` |
| `/downloads/FabTune.apk` | `GET` | Alternate direct APK download | `application/vnd.android.package-archive` |
| `/api/download/apk` | `GET` | API endpoint for APK download | `application/vnd.android.package-archive` |
| `/apk.exp` | `GET` | Version export metadata specification | `text/plain; charset=utf-8` |
| `/version.apk.exp` | `GET` | Version export specification alias | `text/plain; charset=utf-8` |
| `/api/search` | `GET` | Query tracks, artists, and albums | `application/json` |
| `/api/stream/:id` | `GET` | Audio stream proxy | `audio/mpeg` |
| `/api/lyrics/:id` | `GET` | Synchronized timestamped lyrics | `application/json` |

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
