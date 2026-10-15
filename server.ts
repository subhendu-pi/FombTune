process.env.DISABLE_HMR = 'true';

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const apkPathPublic = path.resolve(__dirname, 'public', 'FabTune.apk');
const apkPathDist = path.resolve(__dirname, 'dist', 'FabTune.apk');

const handleApkDownload = (_req: express.Request, res: express.Response) => {
  const targetPath = fs.existsSync(apkPathPublic)
    ? apkPathPublic
    : fs.existsSync(apkPathDist)
    ? apkPathDist
    : null;

  if (targetPath) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="FabTune.apk"');
    res.sendFile(targetPath);
  } else {
    res.status(404).send('APK file is generating. Please retry in a moment.');
  }
};

app.get('/FabTune.apk', handleApkDownload);
app.get('/downloads/FabTune.apk', handleApkDownload);
app.get('/api/download/apk', handleApkDownload);

const apkExpPath = path.resolve(__dirname, 'apk.exp');
const apkExpPublic = path.resolve(__dirname, 'public', 'apk.exp');
const handleApkExp = (_req: express.Request, res: express.Response) => {
  const target = fs.existsSync(apkExpPath)
    ? apkExpPath
    : fs.existsSync(apkExpPublic)
    ? apkExpPublic
    : null;
  if (target) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.sendFile(target);
  } else {
    res.status(404).send('apk.exp specification not found');
  }
};

app.get('/apk.exp', handleApkExp);
app.get('/version.apk.exp', handleApkExp);
app.get('/api/version/apk', handleApkExp);

const YTM_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-YouTube-Client-Name': '67',
  'X-YouTube-Client-Version': '1.20240101.01.00',
  Origin: 'https://music.youtube.com',
  Referer: 'https://music.youtube.com/',
};

const YTM_CONTEXT = {
  client: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20240101.01.00',
    hl: 'en',
    gl: 'US',
  },
};

// Parse duration string like "3:45" to seconds
function parseDurationSecs(str?: string): number {
  if (!str) return 180;
  const parts = str.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 180;
}

// 1. Search endpoint
app.get('/api/yt/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    const filter = req.query.filter as string;
    if (!q || !q.trim()) {
      return res.json({ results: [] });
    }

    // Filter params mapping matching ytmusicapi search
    let params: string | undefined = undefined;
    if (filter === 'songs') params = 'Eg-KAQwIARAAGAAgACgAMABqChAEEAMQCRAFEAo%3D';
    else if (filter === 'albums') params = 'Eg-KAQwBAhABGAEgACgAMABqChAEEAMQCRAFEAo%3D';
    else if (filter === 'artists') params = 'Eg-KAQwIAhABGAEgACgAMABqChAEEAMQCRAFEAo%3D';
    else if (filter === 'playlists') params = 'Eg-KAQwIABAAGAAgACgAMABqChAEEAMQCRAFEAo%3D';

    const response = await fetch('https://music.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      headers: YTM_HEADERS,
      body: JSON.stringify({
        context: YTM_CONTEXT,
        query: q.trim(),
        params,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'YouTube Music Search error' });
    }

    const data = await response.json();
    const sections =
      data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    const results: any[] = [];

    for (const section of sections) {
      // Check card shelf
      if (section.musicCardShelfRenderer) {
        const card = section.musicCardShelfRenderer;
        const videoId =
          card?.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId ||
          card?.buttons?.[0]?.buttonRenderer?.navigationEndpoint?.watchEndpoint?.videoId;
        const title = card?.title?.runs?.[0]?.text;
        const subtitleRuns = card?.subtitle?.runs || [];
        const artist = subtitleRuns[2]?.text || subtitleRuns[0]?.text || 'YouTube Music';
        const durationStr = subtitleRuns.slice(-1)[0]?.text;
        const thumb = card?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url;

        if (videoId && title) {
          results.push({
            id: videoId,
            videoId,
            title,
            artist,
            album: 'Single',
            duration: parseDurationSecs(durationStr),
            coverUrl: thumb,
            genre: 'YouTube Music',
            year: new Date().getFullYear(),
            plays: 98000,
            audioType: 'url',
            accentColor: '#14b8a6',
          });
        }
      }

      // Check itemSection or musicShelf
      const items = section?.itemSectionRenderer?.contents || section?.musicShelfRenderer?.contents || [];
      for (const item of items) {
        const r = item?.musicResponsiveListItemRenderer;
        if (!r) continue;

        const videoId =
          r?.playlistItemData?.videoId ||
          r?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint
            ?.watchEndpoint?.videoId;
        const title = r?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;

        const subtitleRuns = r?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        // Extract artist
        const artistRun = subtitleRuns.find(
          (run: any) =>
            run.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
              ?.browseEndpointContextMusicConfig?.pageType === 'MUSIC_PAGE_TYPE_ARTIST'
        );
        const artist = artistRun?.text || subtitleRuns[2]?.text || subtitleRuns[0]?.text || 'Unknown Artist';

        // Extract album if present
        const albumRun = subtitleRuns.find(
          (run: any) =>
            run.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
              ?.browseEndpointContextMusicConfig?.pageType === 'MUSIC_PAGE_TYPE_ALBUM'
        );
        const album = albumRun?.text || 'YouTube Music Track';

        // Extract duration
        const lastRun = subtitleRuns.slice(-1)[0]?.text;
        const duration = parseDurationSecs(lastRun);

        const thumbs = r?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
        const thumb = thumbs.slice(-1)[0]?.url || thumbs[0]?.url;

        if (videoId && title) {
          results.push({
            id: videoId,
            videoId,
            title,
            artist,
            album,
            duration,
            coverUrl: thumb,
            genre: 'YouTube Music',
            year: new Date().getFullYear(),
            plays: Math.floor(Math.random() * 200000) + 10000,
            audioType: 'url',
            accentColor: '#818cf8',
          });
        }
      }
    }

    res.json({ results });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Charts & Trending endpoint
app.get('/api/yt/charts', async (req, res) => {
  try {
    const response = await fetch('https://music.youtube.com/youtubei/v1/browse?prettyPrint=false', {
      method: 'POST',
      headers: YTM_HEADERS,
      body: JSON.stringify({
        context: YTM_CONTEXT,
        browseId: 'FEmusic_charts',
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch charts' });
    }

    const data = await response.json();
    const sections =
      data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    const tracks: any[] = [];

    // Parse sections
    for (const section of sections) {
      const carousel = section.musicCarouselShelfRenderer;
      if (carousel?.contents) {
        for (const cItem of carousel.contents) {
          const item = cItem.musicResponsiveListItemRenderer || cItem.musicTwoRowItemRenderer;
          if (!item) continue;

          // For two row item
          if (cItem.musicTwoRowItemRenderer) {
            const twoRow = cItem.musicTwoRowItemRenderer;
            const title = twoRow.title?.runs?.[0]?.text;
            const subtitle = twoRow.subtitle?.runs?.map((r: any) => r.text).join('') || 'Top Chart';
            const thumbs = twoRow.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
            const thumb = thumbs.slice(-1)[0]?.url;
            const videoId = twoRow.navigationEndpoint?.watchEndpoint?.videoId;

            if (title && (videoId || twoRow.navigationEndpoint?.browseEndpoint?.browseId)) {
              tracks.push({
                id: videoId || twoRow.navigationEndpoint?.browseEndpoint?.browseId,
                videoId,
                title,
                artist: subtitle,
                album: 'Trending',
                duration: 210,
                coverUrl: thumb,
                genre: 'Trending',
                year: 2024,
                plays: 540000,
                audioType: 'url',
                accentColor: '#f59e0b',
              });
            }
          }
        }
      }
    }

    res.json({ tracks });
  } catch (error: any) {
    console.error('Charts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2.5. Recommendations & Radio endpoint
app.get('/api/yt/recommendations', async (req, res) => {
  try {
    const videoId = req.query.videoId as string;
    const artist = req.query.artist as string;
    const genre = req.query.genre as string;
    const title = req.query.title as string;

    const recommendations: any[] = [];

    // 1. If videoId exists, use YouTube Music's RDAMVM auto-mix radio
    if (videoId && videoId.length > 5) {
      try {
        const nextRes = await fetch('https://music.youtube.com/youtubei/v1/next?prettyPrint=false', {
          method: 'POST',
          headers: YTM_HEADERS,
          body: JSON.stringify({
            context: YTM_CONTEXT,
            videoId,
            playlistId: 'RDAMVM' + videoId,
          }),
        });

        if (nextRes.ok) {
          const nextData = await nextRes.json();
          const tabs =
            nextData?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer
              ?.watchNextTabbedResultsRenderer?.tabs;
          const queueRenderer = tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer;
          const playlistItems = queueRenderer?.content?.playlistPanelRenderer?.contents || [];

          for (const item of playlistItems) {
            const r = item?.playlistPanelVideoRenderer;
            if (!r || !r.videoId || r.videoId === videoId) continue;

            const t = r.title?.runs?.[0]?.text;
            const a = r.shortBylineText?.runs?.map((x: any) => x.text).join('') || 'YouTube Artist';
            const duration = parseDurationSecs(r.lengthText?.runs?.[0]?.text);
            const thumb = r.thumbnail?.thumbnails?.slice(-1)[0]?.url;

            if (t) {
              recommendations.push({
                id: r.videoId,
                videoId: r.videoId,
                title: t,
                artist: a,
                album: 'Radio Recommendations',
                duration: duration || 200,
                coverUrl: thumb,
                genre: genre || 'YouTube Music',
                year: 2024,
                plays: Math.floor(Math.random() * 200000) + 15000,
                audioType: 'youtube',
                accentColor: '#14b8a6',
              });
            }
          }
        }
      } catch (err) {
        console.warn('Radio playlist fetch error:', err);
      }
    }

    // 2. If recommendations are still empty, fall back to searching similar tracks by artist / genre
    if (recommendations.length === 0) {
      const searchQuery = artist && artist !== 'Unknown Artist' ? `${artist} songs` : `${genre || title || 'popular'} music`;
      try {
        const searchRes = await fetch('https://music.youtube.com/youtubei/v1/search?prettyPrint=false', {
          method: 'POST',
          headers: YTM_HEADERS,
          body: JSON.stringify({
            context: YTM_CONTEXT,
            query: searchQuery,
            params: 'Eg-KAQwIARAAGAAgACgAMABqChAEEAMQCRAFEAo%3D',
          }),
        });

        if (searchRes.ok) {
          const data = await searchRes.json();
          const sections =
            data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

          for (const section of sections) {
            const items = section?.itemSectionRenderer?.contents || section?.musicShelfRenderer?.contents || [];
            for (const item of items) {
              const r = item?.musicResponsiveListItemRenderer;
              if (!r) continue;
              const vId =
                r?.playlistItemData?.videoId ||
                r?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint
                  ?.watchEndpoint?.videoId;
              const t = r?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
              const subtitleRuns = r?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
              const a = subtitleRuns[2]?.text || subtitleRuns[0]?.text || 'Recommended Artist';
              const duration = parseDurationSecs(subtitleRuns.slice(-1)[0]?.text);
              const thumb = r?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url;

              if (vId && t && vId !== videoId) {
                recommendations.push({
                  id: vId,
                  videoId: vId,
                  title: t,
                  artist: a,
                  album: 'Recommended For You',
                  duration: duration || 190,
                  coverUrl: thumb,
                  genre: genre || 'Music',
                  year: 2024,
                  plays: 64000,
                  audioType: 'youtube',
                  accentColor: '#818cf8',
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Fallback recommendations search error:', err);
      }
    }

    res.json({ recommendations });
  } catch (error: any) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Lyrics endpoint (combines LrcLib synced lyrics + YouTube Music fallback)
app.get('/api/yt/lyrics', async (req, res) => {
  try {
    const trackName = (req.query.title as string) || '';
    const artistName = (req.query.artist as string) || '';
    const videoId = (req.query.videoId as string) || '';

    let lyricsList: { time: number; text: string; romanized?: string }[] = [];

    // 1. First attempt LrcLib for exact synchronized LRC lyrics
    if (trackName) {
      try {
        const cleanTrack = trackName.replace(/\(.*?\)|\[.*?\]/g, '').trim();
        const lrcRes = await fetch(
          `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(
            artistName
          )}`,
          {
            headers: { 'User-Agent': 'FabTune/1.0.0 (https://github.com/metrolist/music)' },
          }
        );

        if (lrcRes.ok) {
          const lrcData = await lrcRes.json();
          if (lrcData.syncedLyrics) {
            const lines = lrcData.syncedLyrics.split('\n');
            for (const line of lines) {
              const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
              if (match) {
                const mins = parseFloat(match[1]);
                const secs = parseFloat(match[2]);
                const text = match[3]?.trim();
                if (text) {
                  lyricsList.push({
                    time: mins * 60 + secs,
                    text,
                  });
                }
              }
            }
            if (lyricsList.length > 0) {
              return res.json({ synced: true, lyrics: lyricsList });
            }
          }
        }
      } catch (err) {
        console.warn('LrcLib fetch error:', err);
      }
    }

    // 2. Fallback to YouTube Music InnerTube Next endpoint
    if (videoId) {
      try {
        const nextRes = await fetch('https://music.youtube.com/youtubei/v1/next?prettyPrint=false', {
          method: 'POST',
          headers: YTM_HEADERS,
          body: JSON.stringify({
            context: YTM_CONTEXT,
            videoId,
          }),
        });

        if (nextRes.ok) {
          const nextData = await nextRes.json();
          const tabs =
            nextData?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer
              ?.watchNextTabbedResultsRenderer?.tabs;

          let lyricsBrowseId: string | null = null;
          for (const t of tabs || []) {
            const bId = t?.tabRenderer?.endpoint?.browseEndpoint?.browseId;
            if (bId && bId.startsWith('MPLYt_')) {
              lyricsBrowseId = bId;
              break;
            }
          }

          if (lyricsBrowseId) {
            const browseRes = await fetch('https://music.youtube.com/youtubei/v1/browse?prettyPrint=false', {
              method: 'POST',
              headers: YTM_HEADERS,
              body: JSON.stringify({
                context: YTM_CONTEXT,
                browseId: lyricsBrowseId,
              }),
            });

            if (browseRes.ok) {
              const browseData = await browseRes.json();
              const text =
                browseData?.contents?.sectionListRenderer?.contents?.[0]?.musicDescriptionShelfRenderer?.description
                  ?.runs?.[0]?.text;

              if (text) {
                const rawLines = text.split('\n').filter((l: string) => l.trim().length > 0);
                const step = 4; // approx spacing
                lyricsList = rawLines.map((line: string, idx: number) => ({
                  time: idx * step,
                  text: line.trim(),
                }));
                return res.json({ synced: false, lyrics: lyricsList });
              }
            }
          }
        }
      } catch (err) {
        console.warn('YTM lyrics error:', err);
      }
    }

    res.json({ synced: false, lyrics: lyricsList });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Instant Search Suggestions (Google / YouTube Music autocomplete)
app.get('/api/yt/suggestions', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q) return res.json({ suggestions: [] });

    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`
    );
    if (!response.ok) {
      return res.json({ suggestions: [] });
    }
    const data = await response.json();
    const suggestions = data?.[1] || [];
    res.json({ suggestions });
  } catch (e: any) {
    res.json({ suggestions: [] });
  }
});

// Mount Vite or serve static
async function startServer() {
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`FabTune YouTube Music Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
