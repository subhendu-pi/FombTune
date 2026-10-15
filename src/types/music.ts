export interface LyricsLine {
  time: number; // in seconds
  text: string;
  romanized?: string;
}

export type AudioType = 'synth' | 'url' | 'local' | 'youtube';

export interface Song {
  id: string;
  videoId?: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  genre: string;
  year: number;
  plays: number;
  coverGradient: string;
  accentColor: string;
  coverArtworkType: 'lofi' | 'synthwave' | 'acoustic' | 'ambient' | 'jazz' | 'piano' | 'cyber' | 'custom';
  coverUrl?: string;
  lyrics: LyricsLine[];
  audioType: AudioType;
  audioUrl?: string; // external or blob
  bpm?: number;
  musicalKey?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverGradient: string;
  songIds: string[];
  createdAt: string;
  isCustom?: boolean;
}

export type PlaybackRepeat = 'off' | 'all' | 'one';

export type PlayerViewMode = 'disc' | 'album' | 'lyrics' | 'equalizer' | 'queue';

export type ActiveTab = 'home' | 'explore' | 'library' | 'search' | 'wrapped';

export interface EQBandConfig {
  frequency: number;
  label: string;
  gain: number; // -12dB to +12dB
}

export interface EQPreset {
  name: string;
  gains: number[]; // 10 values for the 10 bands
}

export type ColorTheme =
  | 'monet-teal'
  | 'monet-purple'
  | 'sunset-amber'
  | 'cyber-blue'
  | 'forest-emerald'
  | 'rose-quartz';

export type ThemeBrightness = 'dark' | 'light' | 'oled';

export interface UserListeningStats {
  totalMinutes: number;
  topSongId: string;
  topArtist: string;
  topGenre: string;
  playedTrackCounts: Record<string, number>;
  personaTitle: string;
  personaDescription: string;
}
