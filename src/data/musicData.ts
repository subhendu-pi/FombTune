import { Playlist, Song } from '../types/music';

// Clean slate: all default bundled songs removed.
// The user starts with an empty library and builds it through InnerTube search, streaming, or local audio uploads.
export const INITIAL_SONGS: Song[] = [];

export const INITIAL_PLAYLISTS: Playlist[] = [];

export const GENRE_CATEGORIES = [
  { name: 'Lo-Fi / Chill', icon: 'Coffee', count: '14,200 songs', gradient: 'from-indigo-600 to-purple-900' },
  { name: 'Synthwave', icon: 'Zap', count: '8,400 songs', gradient: 'from-fuchsia-600 to-pink-900' },
  { name: 'Acoustic', icon: 'Trees', count: '11,100 songs', gradient: 'from-emerald-600 to-teal-900' },
  { name: 'Ambient', icon: 'Moon', count: '6,300 songs', gradient: 'from-cyan-600 to-blue-900' },
  { name: 'Pop', icon: 'Flame', count: '24,500 songs', gradient: 'from-amber-600 to-rose-900' },
  { name: 'R&B / Soul', icon: 'Disc', count: '9,800 songs', gradient: 'from-orange-600 to-amber-900' },
  { name: 'Piano Lo-Fi', icon: 'CloudRain', count: '5,600 songs', gradient: 'from-slate-600 to-zinc-900' },
];

export const MOOD_TAGS = [
  'Chill & Relax',
  'Deep Focus',
  'Night Drive',
  'Gym Workout',
  'Acoustic Morning',
  'Gaming & Beats',
  'Party Vibes',
  'Sleep & Meditate',
];
