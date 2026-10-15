#!/usr/bin/env python3
import os
import sys
import shutil
import zipfile
import struct
import hashlib
import zlib
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP_DIR = '/tmp/fabtune_apk_build'
SAMPLE_APK = '/tmp/sample.apk'
KEYSTORE = '/tmp/fabtune.keystore'
OUTPUT_APK = os.path.join(BASE_DIR, 'public', 'FabTune.apk')

def ensure_sample_apk():
    if not os.path.exists(SAMPLE_APK):
        print("Downloading base APK package...")
        subprocess.run([
            'curl', '-sL',
            'https://github.com/bishwassagar/Android-Webview-App/raw/master/app/release/app-release.apk',
            '-o', SAMPLE_APK
        ], check=True)

def ensure_keystore():
    if not os.path.exists(KEYSTORE):
        print("Generating Android release keystore...")
        subprocess.run([
            'keytool', '-genkeypair', '-v',
            '-keystore', KEYSTORE,
            '-alias', 'fabtune',
            '-keyalg', 'RSA',
            '-keysize', '2048',
            '-validity', '10000',
            '-storepass', 'fabtune123',
            '-keypass', 'fabtune123',
            '-dname', 'CN=FabTune, OU=Music, O=FabTune, L=Tokyo, ST=Tokyo, C=JP'
        ], check=True)

def build_offline_html():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#09090b">
  <title>FabTune Music Player</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      user-select: none;
    }
    .top-bar {
      padding: env(safe-area-inset-top, 16px) 16px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(9, 9, 11, 0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      font-size: 1.1rem;
      letter-spacing: -0.02em;
    }
    .logo-badge {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 0.85rem;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }
    .mode-pill {
      font-size: 0.72rem;
      padding: 4px 10px;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
      font-weight: 600;
      cursor: pointer;
    }
    .cloud-btn {
      padding: 6px 12px;
      border-radius: 9999px;
      background: #6366f1;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
    }
    .main-view {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 20px;
      max-width: 480px;
      margin: 0 auto;
      width: 100%;
    }
    /* Turntable */
    .turntable-container {
      position: relative;
      width: 260px;
      height: 260px;
      margin-bottom: 24px;
    }
    .vinyl-disc {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle, #27272a 0%, #18181b 30%, #09090b 70%);
      box-shadow: 0 10px 30px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(255,255,255,0.08);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .vinyl-disc.playing {
      animation: spin 3s linear infinite;
    }
    .vinyl-grooves {
      position: absolute;
      inset: 12px;
      border-radius: 50%;
      border: 1px dashed rgba(255,255,255,0.05);
      box-shadow: inset 0 0 0 15px rgba(255,255,255,0.02), inset 0 0 0 35px rgba(255,255,255,0.015), inset 0 0 0 55px rgba(255,255,255,0.02);
    }
    .vinyl-center {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #d946ef);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.5);
      position: relative;
      overflow: hidden;
    }
    .vinyl-hole {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #09090b;
      border: 2px solid rgba(255,255,255,0.3);
    }
    .tonearm {
      position: absolute;
      top: -10px;
      right: -10px;
      width: 70px;
      height: 140px;
      pointer-events: none;
      transform-origin: 50px 15px;
      transform: rotate(-25deg);
      transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 10;
    }
    .tonearm.playing {
      transform: rotate(14deg);
    }
    .tonearm-head {
      width: 14px;
      height: 24px;
      background: #d4d4d8;
      border-radius: 2px;
      position: absolute;
      bottom: 0;
      left: 12px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    }
    .tonearm-rod {
      width: 4px;
      height: 110px;
      background: #71717a;
      position: absolute;
      top: 15px;
      right: 20px;
      border-radius: 2px;
      transform: rotate(-15deg);
    }
    .tonearm-base {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #27272a;
      border: 2px solid #52525b;
      position: absolute;
      top: 5px;
      right: 5px;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .song-info {
      text-align: center;
      margin-bottom: 20px;
      width: 100%;
    }
    .song-title {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 4px;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .song-artist {
      font-size: 0.9rem;
      color: #a1a1aa;
      font-weight: 500;
    }
    .time-bar {
      width: 100%;
      margin-bottom: 18px;
    }
    .progress-slider {
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      background: rgba(255,255,255,0.12);
      border-radius: 9999px;
      outline: none;
    }
    .progress-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #6366f1;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.8);
    }
    .time-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: #71717a;
      margin-top: 6px;
    }
    /* Controls */
    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      width: 100%;
      margin-bottom: 24px;
    }
    .btn-circle {
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-sub {
      width: 44px;
      height: 44px;
      background: rgba(255,255,255,0.06);
      color: #d4d4d8;
    }
    .btn-sub.active {
      color: #a5b4fc;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
    }
    .btn-play {
      width: 64px;
      height: 64px;
      background: #ffffff;
      color: #09090b;
      box-shadow: 0 6px 20px rgba(255, 255, 255, 0.25);
    }
    .btn-play:active {
      transform: scale(0.94);
    }
    /* Equalizer Presets */
    .eq-bar {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      width: 100%;
      padding-bottom: 8px;
      margin-bottom: 16px;
      scrollbar-width: none;
    }
    .eq-bar::-webkit-scrollbar { display: none; }
    .eq-pill {
      flex-shrink: 0;
      padding: 6px 12px;
      border-radius: 9999px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: #a1a1aa;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
    }
    .eq-pill.active {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.5);
      color: #ffffff;
    }
    /* Queue List */
    .queue-card {
      width: 100%;
      background: rgba(24, 24, 27, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 12px 14px;
    }
    .queue-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .queue-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.82rem;
    }
    .queue-item.active {
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="logo">
      <div class="logo-badge">F</div>
      <span>FabTune</span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <span class="mode-pill" id="modeIndicator" onclick="toggleOnlineCheck()">Offline Native</span>
      <button class="cloud-btn" onclick="openCloudApp()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
        Cloud
      </button>
    </div>
  </div>

  <div class="main-view">
    <div class="turntable-container">
      <div class="vinyl-disc" id="vinylDisc">
        <div class="vinyl-grooves"></div>
        <div class="vinyl-center">
          <div class="vinyl-hole"></div>
        </div>
      </div>
      <div class="tonearm" id="tonearm">
        <div class="tonearm-base"></div>
        <div class="tonearm-rod"></div>
        <div class="tonearm-head"></div>
      </div>
    </div>

    <div class="song-info">
      <div class="song-title" id="songTitle">Midnight Lo-Fi Dreams</div>
      <div class="song-artist" id="songArtist">FabTune Acoustic Studio</div>
    </div>

    <div class="time-bar">
      <input type="range" class="progress-slider" id="progressSlider" min="0" max="100" value="0">
      <div class="time-labels">
        <span id="currentTimeLabel">0:00</span>
        <span id="durationLabel">3:15</span>
      </div>
    </div>

    <!-- Playback options: Shuffle, Previous, Play/Pause, Next, 3-tap Repeat -->
    <div class="controls">
      <button class="btn-circle btn-sub" id="shuffleBtn" onclick="toggleShuffle()" title="Shuffle">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.5-.7-3.3-1.8l-.5-.7"/><path d="m18 14 4 4-4 4"/></svg>
      </button>

      <button class="btn-circle btn-sub" onclick="prevSong()" title="Previous">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
      </button>

      <button class="btn-circle btn-play" id="playBtn" onclick="togglePlay()" title="Play">
        <svg id="playIcon" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </button>

      <button class="btn-circle btn-sub" onclick="nextSong()" title="Next">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
      </button>

      <button class="btn-circle btn-sub" id="repeatBtn" onclick="cycleRepeat()" title="3-Tap Repeat">
        <span id="repeatText" style="font-size:0.75rem;font-weight:700;">ALL</span>
      </button>
    </div>

    <!-- Equalizer presets -->
    <div class="eq-bar">
      <div class="eq-pill active" onclick="setEq('flat', this)">Balanced Flat</div>
      <div class="eq-pill" onclick="setEq('bass', this)">Bass Boost +6dB</div>
      <div class="eq-pill" onclick="setEq('vocal', this)">Vocal Clarity</div>
      <div class="eq-pill" onclick="setEq('synth', this)">Synthwave Neon</div>
      <div class="eq-pill" onclick="setEq('acoustic', this)">Acoustic Warmth</div>
    </div>

    <!-- Queue preview -->
    <div class="queue-card">
      <div class="queue-title">Offline Native Playlist</div>
      <div id="queueList"></div>
    </div>
  </div>

  <script>
    const CLOUD_URL = window.location.origin.includes('run.app') 
      ? window.location.origin 
      : 'https://ais-pre-6b5htyvgq6qhqeain62dsx-705200066599.asia-northeast1.run.app';

    const SONGS = [
      { id: '1', title: 'Midnight Lo-Fi Dreams', artist: 'FabTune Acoustic', duration: 195, rootFreq: 220, chordProg: [220, 261.6, 329.6, 293.7] },
      { id: '2', title: 'Cyber City Tokyo 2088', artist: 'Neon Voyager', duration: 210, rootFreq: 146.8, chordProg: [146.8, 174.6, 220, 196] },
      { id: '3', title: 'Rainy Cafe Chillout', artist: 'Sofi Beats', duration: 180, rootFreq: 196, chordProg: [196, 246.9, 293.7, 329.6] },
      { id: '4', title: 'Acoustic Sunset Horizon', artist: 'Aura Bloom', duration: 225, rootFreq: 164.8, chordProg: [164.8, 207.6, 246.9, 220] }
    ];

    let currentIdx = 0;
    let isPlaying = false;
    let currentTime = 0;
    let repeatMode = 'all'; // 'off', 'all', 'one'
    let isShuffle = false;
    let playTimer = null;
    let audioCtx = null;
    let activeNodes = [];

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    function playSynthPattern() {
      stopSynth();
      if (!audioCtx) return;
      const song = SONGS[currentIdx];
      
      // Multi-oscillator musical ambient chord pad
      song.chordProg.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        // Slight organic vibrato
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 0.2 + idx * 0.1;
        lfoGain.gain.value = 1.5;
        lfo.connect(osc.frequency);
        lfo.start();
        activeNodes.push(lfo);

        gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08 / song.chordProg.length, audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        activeNodes.push(osc, gain);
      });
    }

    function stopSynth() {
      activeNodes.forEach(node => {
        try { node.stop ? node.stop() : node.disconnect(); } catch(e){}
      });
      activeNodes = [];
    }

    function updateUI() {
      const song = SONGS[currentIdx];
      document.getElementById('songTitle').textContent = song.title;
      document.getElementById('songArtist').textContent = song.artist;
      document.getElementById('durationLabel').textContent = formatTime(song.duration);
      document.getElementById('progressSlider').max = song.duration;
      document.getElementById('progressSlider').value = currentTime;
      document.getElementById('currentTimeLabel').textContent = formatTime(currentTime);

      const vinyl = document.getElementById('vinylDisc');
      const tonearm = document.getElementById('tonearm');
      const playIcon = document.getElementById('playIcon');

      if (isPlaying) {
        vinyl.classList.add('playing');
        tonearm.classList.add('playing');
        playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
      } else {
        vinyl.classList.remove('playing');
        tonearm.classList.remove('playing');
        playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
      }

      // 3-Tap repeat UI
      const repeatText = document.getElementById('repeatText');
      const repeatBtn = document.getElementById('repeatBtn');
      if (repeatMode === 'one') {
        repeatText.textContent = '1';
        repeatBtn.className = 'btn-circle btn-sub active';
      } else if (repeatMode === 'all') {
        repeatText.textContent = 'ALL';
        repeatBtn.className = 'btn-circle btn-sub active';
      } else {
        repeatText.textContent = 'OFF';
        repeatBtn.className = 'btn-circle btn-sub';
      }

      // Shuffle UI
      document.getElementById('shuffleBtn').className = isShuffle ? 'btn-circle btn-sub active' : 'btn-circle btn-sub';

      renderQueue();
      updateMediaSession();
    }

    function renderQueue() {
      const container = document.getElementById('queueList');
      container.innerHTML = SONGS.map((s, idx) => `
        <div class="queue-item ${idx === currentIdx ? 'active' : ''}" onclick="selectSong(${idx})">
          <span>${s.title}</span>
          <span style="font-size:0.75rem;opacity:0.7;">${formatTime(s.duration)}</span>
        </div>
      `).join('');
    }

    function togglePlay() {
      initAudio();
      isPlaying = !isPlaying;
      if (isPlaying) {
        playSynthPattern();
        clearInterval(playTimer);
        playTimer = setInterval(() => {
          currentTime++;
          const song = SONGS[currentIdx];
          if (currentTime >= song.duration) {
            handleSongEnd();
          } else {
            updateUI();
          }
        }, 1000);
      } else {
        stopSynth();
        clearInterval(playTimer);
      }
      updateUI();
    }

    function handleSongEnd() {
      if (repeatMode === 'one') {
        currentTime = 0;
        updateUI();
      } else if (repeatMode === 'all') {
        nextSong();
      } else {
        if (currentIdx < SONGS.length - 1) {
          nextSong();
        } else {
          isPlaying = false;
          stopSynth();
          currentTime = 0;
          clearInterval(playTimer);
          updateUI();
        }
      }
    }

    function nextSong() {
      currentTime = 0;
      if (isShuffle) {
        currentIdx = Math.floor(Math.random() * SONGS.length);
      } else {
        currentIdx = (currentIdx + 1) % SONGS.length;
      }
      if (isPlaying) playSynthPattern();
      updateUI();
    }

    function prevSong() {
      if (currentTime > 4) {
        currentTime = 0;
      } else {
        currentTime = 0;
        currentIdx = (currentIdx - 1 + SONGS.length) % SONGS.length;
      }
      if (isPlaying) playSynthPattern();
      updateUI();
    }

    function selectSong(idx) {
      currentIdx = idx;
      currentTime = 0;
      if (!isPlaying) {
        togglePlay();
      } else {
        playSynthPattern();
        updateUI();
      }
    }

    function cycleRepeat() {
      if (repeatMode === 'all') repeatMode = 'one';
      else if (repeatMode === 'one') repeatMode = 'off';
      else repeatMode = 'all';
      updateUI();
    }

    function toggleShuffle() {
      isShuffle = !isShuffle;
      updateUI();
    }

    function setEq(type, el) {
      document.querySelectorAll('.eq-pill').forEach(p => p.classList.remove('active'));
      el.classList.add('active');
    }

    function formatTime(s) {
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function updateMediaSession() {
      if ('mediaSession' in navigator) {
        const song = SONGS[currentIdx];
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: 'FabTune Android Offline Edition',
          artwork: [
            { src: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=512&q=80', sizes: '512x512', type: 'image/jpeg' }
          ]
        });
        navigator.mediaSession.setActionHandler('play', () => togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => prevSong());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
      }
    }

    function openCloudApp() {
      window.location.href = CLOUD_URL;
    }

    function toggleOnlineCheck() {
      if (navigator.onLine) {
        if (confirm("Online network detected. Switch to FabTune Cloud Live Radio & Streaming?")) {
          window.location.href = CLOUD_URL;
        }
      } else {
        alert("Device is offline. Playing local offline turntable music.");
      }
    }

    // Auto-connect to cloud if user prefers and network is online
    window.addEventListener('load', () => {
      updateUI();
      if (navigator.onLine && localStorage.getItem('fabtune_prefer_cloud') === 'true') {
        window.location.href = CLOUD_URL;
      }
    });

    document.getElementById('progressSlider').addEventListener('input', (e) => {
      currentTime = parseInt(e.target.value, 10);
      document.getElementById('currentTimeLabel').textContent = formatTime(currentTime);
    });
  </script>
</body>
</html>"""

def main():
    print("=== FabTune Android APK Packager & Signer ===")
    ensure_sample_apk()
    ensure_keystore()

    if os.path.exists(TMP_DIR):
        shutil.rmtree(TMP_DIR)
    os.makedirs(TMP_DIR, exist_ok=True)

    print("Extracting sample APK template...")
    with zipfile.ZipFile(SAMPLE_APK, 'r') as z:
        z.extractall(TMP_DIR)

    # 1. Patch classes.dex: URL redirection to file:///android_asset/main.html
    dex_path = os.path.join(TMP_DIR, 'classes.dex')
    with open(dex_path, 'rb') as f:
        dex = bytearray(f.read())

    old_url = b'https://github.com/bishwassagar'
    new_url = b'file:///android_asset/main.html'
    assert len(old_url) == len(new_url)

    if old_url in dex:
        print("Patching classes.dex target URL...")
        dex = bytearray(bytes(dex).replace(old_url, new_url))
        # Recalculate SHA-1
        sha1 = hashlib.sha1(dex[32:]).digest()
        dex[12:32] = sha1
        # Recalculate Adler32
        adler = zlib.adler32(dex[12:]) & 0xffffffff
        dex[8:12] = struct.pack('<I', adler)
        with open(dex_path, 'wb') as f:
            f.write(dex)
        print("classes.dex patched with Adler32 and SHA-1 updated.")

    # 2. Patch resources.arsc: app name to "FabTune Player"
    arsc_path = os.path.join(TMP_DIR, 'resources.arsc')
    with open(arsc_path, 'rb') as f:
        arsc = bytearray(f.read())
    old_name = b'My Application'
    new_name = b'FabTune Player'
    assert len(old_name) == len(new_name)
    if old_name in arsc:
        print("Patching resources.arsc app name...")
        arsc = bytearray(bytes(arsc).replace(old_name, new_name))
        with open(arsc_path, 'wb') as f:
            f.write(arsc)
        print("resources.arsc patched with 'FabTune Player'.")

    # 3. Inject launcher icons from /public/pwa-192x192.png
    public_icon = os.path.join(BASE_DIR, 'public', 'pwa-192x192.png')
    if os.path.exists(public_icon):
        with open(public_icon, 'rb') as f:
            icon_data = f.read()
        icon_res_files = [
            'res/9w.png', 'res/zR.png', 'res/8c.png', 'res/yn.png',
            'res/FS.png', 'res/wb.png', 'res/RJ.png', 'res/fO.png',
            'res/Gc.png', 'res/o-.png'
        ]
        for icon_rel in icon_res_files:
            target_path = os.path.join(TMP_DIR, icon_rel)
            if os.path.exists(target_path):
                with open(target_path, 'wb') as f:
                    f.write(icon_data)
        print("Launcher icons replaced with FabTune icon.")

    # 4. Inject offline and main HTML assets
    assets_dir = os.path.join(TMP_DIR, 'assets')
    os.makedirs(assets_dir, exist_ok=True)
    html_content = build_offline_html()
    with open(os.path.join(assets_dir, 'main.html'), 'w') as f:
        f.write(html_content)
    with open(os.path.join(assets_dir, 'offline.html'), 'w') as f:
        f.write(html_content)
    print("Injected assets/main.html and assets/offline.html.")

    # 5. Remove existing signatures in META-INF
    meta_inf = os.path.join(TMP_DIR, 'META-INF')
    if os.path.exists(meta_inf):
        for root, dirs, files in os.walk(meta_inf):
            for file in files:
                if file.endswith(('.SF', '.RSA', '.DSA', '.EC', 'MANIFEST.MF')):
                    os.remove(os.path.join(root, file))

    # 6. Repack into unaligned ZIP
    unaligned_apk = '/tmp/fabtune_unaligned.apk'
    if os.path.exists(unaligned_apk):
        os.remove(unaligned_apk)

    print("Packaging unaligned APK...")
    with zipfile.ZipFile(unaligned_apk, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(TMP_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, TMP_DIR)
                # Store uncompressed for resources.arsc and .png as per Android standard
                if rel_path == 'resources.arsc' or rel_path.endswith('.png'):
                    z.write(full_path, rel_path, compress_type=zipfile.ZIP_STORED)
                else:
                    z.write(full_path, rel_path, compress_type=zipfile.ZIP_DEFLATED)

    # 7. Zipalign (4-byte alignment)
    aligned_apk = '/tmp/fabtune_aligned.apk'
    if os.path.exists(aligned_apk):
        os.remove(aligned_apk)
    print("Running zipalign...")
    subprocess.run(['zipalign', '-f', '-p', '4', unaligned_apk, aligned_apk], check=True)

    # 8. Sign with apksigner (v1 + v2 + v3 signatures)
    print("Signing APK with apksigner...")
    subprocess.run([
        'apksigner', 'sign',
        '--ks', KEYSTORE,
        '--ks-key-alias', 'fabtune',
        '--ks-pass', 'pass:fabtune123',
        '--key-pass', 'pass:fabtune123',
        '--out', OUTPUT_APK,
        aligned_apk
    ], check=True)

    # 9. Verify signature
    print("Verifying signed APK...")
    res = subprocess.run(['apksigner', 'verify', '--verbose', OUTPUT_APK], capture_output=True, text=True)
    print(res.stdout)
    if res.returncode == 0:
        apk_size = os.path.getsize(OUTPUT_APK)
        print(f"SUCCESS! FabTune.apk created at {OUTPUT_APK} (Size: {apk_size / 1024:.1f} KB)")
    else:
        print("Verification warning:", res.stderr)

if __name__ == '__main__':
    main()
