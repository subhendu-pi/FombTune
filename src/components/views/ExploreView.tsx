import React, { useState, useEffect } from 'react';
import { Song } from '../../types/music';
import { CoverArt } from '../common/CoverArt';
import { GENRE_CATEGORIES } from '../../data/musicData';
import {
  TrendingUp,
  Play,
  Pause,
  Heart,
  Compass,
  Radio,
  Loader2,
  Globe,
  Sparkles,
} from 'lucide-react';

interface ExploreViewProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  likedSongIds: string[];
  onPlaySong: (song: Song) => void;
  onToggleLike: (songId: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  songs,
  currentSong,
  isPlaying,
  likedSongIds,
  onPlaySong,
  onToggleLike,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [chartTracks, setChartTracks] = useState<Song[]>([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);

  // Fetch YouTube Music charts from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchCharts = async () => {
      setIsLoadingCharts(true);
      try {
        const res = await fetch('/api/yt/charts');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.tracks && data.tracks.length > 0) {
            setChartTracks(data.tracks);
          }
        }
      } catch (err) {
        console.warn('Failed to load online charts:', err);
      } finally {
        if (isMounted) setIsLoadingCharts(false);
      }
    };

    fetchCharts();
    return () => {
      isMounted = false;
    };
  }, []);

  const baseSongList = chartTracks.length > 0 ? chartTracks : songs;

  const filteredSongs = selectedGenre
    ? baseSongList.filter((s) => s.genre.toLowerCase().includes(selectedGenre.toLowerCase()))
    : baseSongList;

  return (
    <div className="space-y-8 pb-32">
      {/* Explore Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-widest">
          <Compass className="w-4 h-4" />
          <span>YouTube Music InnerTube Powered</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Explore Charts &amp; Moods
          </h1>
          {chartTracks.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Globe className="w-3.5 h-3.5" />
              <span>Live Global Charts Active</span>
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-400">
          Stream real-time trending releases, viral global charts, and curated sonic spectrums.
        </p>
      </div>

      {/* Mood Quick Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedGenre(null)}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
            selectedGenre === null
              ? 'bg-white text-black'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          All Charts &amp; Hits
        </button>

        {GENRE_CATEGORIES.map((genre) => (
          <button
            key={genre.name}
            onClick={() => setSelectedGenre(genre.name === selectedGenre ? null : genre.name)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              selectedGenre === genre.name
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      {/* Top Charts Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              {selectedGenre ? `${selectedGenre} Hits` : 'Top Trending Tracks'}
            </h2>
          </div>
          {isLoadingCharts ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading InnerTube Charts...</span>
            </div>
          ) : (
            <span className="text-xs font-mono text-zinc-400">Updated Daily</span>
          )}
        </div>

        <div className="space-y-2">
          {filteredSongs.map((song, index) => {
            const isCurrent = currentSong?.id === song.id;
            const isLiked = likedSongIds.includes(song.id);

            return (
              <div
                key={song.id}
                onClick={() => onPlaySong(song)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? 'bg-white/15 border-white/30 shadow-md'
                    : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/5'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span
                    className={`w-6 text-center text-sm font-bold font-mono ${
                      index < 3 ? 'text-amber-400' : 'text-zinc-500'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  <CoverArt song={song} size="sm" />

                  <div className="flex flex-col min-w-0 pr-4">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-indigo-400 font-bold' : 'text-white'
                      }`}
                    >
                      {song.title}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate">
                      {song.artist} {song.album && song.album !== 'Trending' ? `· ${song.album}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                  <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                    {song.plays ? song.plays.toLocaleString() + ' plays' : 'Trending'}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLike(song.id);
                    }}
                    className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/5 transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isLiked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                      }`}
                    />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlaySong(song);
                    }}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all shadow-md"
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Explore Genre Cards Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-white">Browse Moods &amp; Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {GENRE_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              onClick={() => setSelectedGenre(cat.name)}
              className={`p-5 rounded-2xl bg-gradient-to-br ${cat.gradient} border border-white/10 shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform flex flex-col justify-between h-32`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/70">{cat.count}</span>
                <Radio className="w-4 h-4 text-white/80" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{cat.name}</h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
