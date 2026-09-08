import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import fallbackData from "../../data/light-content-example.json";
import "./Music.css";
import { useSiteContent } from "../lib/use-site-content.ts";
import { useCurrentSong } from "../lib/use-current-song.ts";
import type { MusicEntry, MusicTrack } from "../lib/site-content.ts";

/*
 * Music subpage — /music
 *
 * Two sections: Best Tracks and Best Albums.
 * Each has boxes with a rank, title, artist, description, and embed.
 *
 * For the `link` field, just paste a normal Apple Music share link like:
 *   https://music.apple.com/us/song/anklebiters/593148442
 * The code auto-converts it to an embed URL.
*/

/**
 * Converts a regular Apple Music share link into an embed URL.
 *
 * Input:  "https://music.apple.com/us/song/anklebiters/593148442"
 * Output: "https://embed.music.apple.com/us/song/anklebiters/593148442?theme=dark"
 */
function toEmbedUrl(shareLink: string): string {
    if (!shareLink) return "";
    return shareLink.replace("https://", "https://embed.") + "?theme=dark";
}

/**
 * A single "music box" — shows rank, title + artist, description, an optional lyric quote,
 * and an Apple Music embed (auto-converted from a share link).
 */
function MusicBox({ rank, title, artist, description, quote, link, embedHeight = 175 }: {
    rank: number;
    title: string;
    artist: string;
    description: string;
    quote?: string;
    link: string;
    embedHeight?: number;
}) {
    const embedUrl = toEmbedUrl(link);
    const [loaded, setLoaded] = useState(false);

    return (
        <div className="music-box">
            <div className="music-box__header">
                <span className="music-box__rank">#{rank}</span>
                <div className="music-box__titles">
                    <span className="music-box__title">{title}</span>
                    {artist && <span className="music-box__artist">{artist}</span>}
                </div>
            </div>
            <p className="music-box__description">{description}</p>
            {quote && <p className="music-box__quote">“<em>{quote}</em>”</p>}
            {embedUrl ? (
                <div className="music-box__embed-wrapper" style={{ height: embedHeight }}>
                    {/* Loading placeholder — visible until iframe fires onLoad */}
                    {!loaded && (
                        <div className="music-box__loading">
                            <span className="music-box__loading-text">loading...</span>
                        </div>
                    )}
                    <iframe
                        className={`music-box__embed ${loaded ? "music-box__embed--loaded" : ""}`}
                        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                        frameBorder="0"
                        height={embedHeight}
                        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                        src={embedUrl}
                        onLoad={() => setLoaded(true)}
                    />
                </div>
            ) : (
                <div className="music-box__embed-placeholder">
                    embed coming soon!
                </div>
            )}
        </div>
    );
}

function CurrentSong() {
    const { metadata, lyrics, loadedAt, loading, error, refresh } = useCurrentSong();
    const lyricsRef = useRef<BraccatoLyricsElement>(null);
    const [braccatoReady, setBraccatoReady] = useState(false);
    const [parsedLyrics, setParsedLyrics] = useState<BraccatoLyric[] | null>(null);
    const [endedPlaybackKey, setEndedPlaybackKey] = useState<number | null>(null);
    const fallbackCover = (fallbackData.nowPlaying as { artworkUrl?: string }).artworkUrl;

    // The upload marks the moment playback conceptually began. Keep this
    // calculation based on wall-clock time so a reload does not reset lyrics.
    const uploadedAt = metadata?.uploadedAt ? Date.parse(metadata.uploadedAt) : NaN;
    const playbackOffset = Number.isFinite(uploadedAt) && loadedAt !== null
        ? Math.max(0, (loadedAt - uploadedAt) / 1000)
        : 0;
    const lyricDuration = parsedLyrics?.reduce(
        (latest, lyric) => Math.max(latest, (lyric.startTimeMs + lyric.durationMs) / 1000),
        0,
    ) ?? 0;
    const duration = metadata?.duration ?? (lyricDuration > 0 ? lyricDuration : undefined);
    const hasEnded = endedPlaybackKey === loadedAt
        || (duration !== undefined && playbackOffset >= duration);

    // playbackOffset is calculated from the upload time, so schedule the
    // transition to "last listened" when the song actually reaches its end.
    // Without this timer, playbackOffset only changes when a new payload loads.
    useEffect(() => {
        if (duration === undefined || loadedAt === null) return;

        const remainingMs = Math.max(0, (duration - playbackOffset) * 1000);
        const timeout = window.setTimeout(() => {
            setEndedPlaybackKey(loadedAt);
        }, remainingMs);

        return () => window.clearTimeout(timeout);
    }, [duration, loadedAt, playbackOffset]);

    // Give the uploader a short grace period after playback ends, then check
    // whether a new song was published. An unchanged/missing payload remains
    // in the "last listened" state; a changed upload starts a new playback.
    useEffect(() => {
        if (!hasEnded) return;
        const timeout = window.setTimeout(() => {
            void refresh();
        }, 10_000);
        return () => window.clearTimeout(timeout);
    }, [hasEnded, refresh]);

    // Register the braccato custom element and parse lyrics
    useEffect(() => {
        if (!lyrics || braccatoReady) return;

        Promise.all([
            import("@braccato/core/element"),
            import("@braccato/core/styles/variables.css"),
            import("@braccato/core/styles/lyrics.css"),
            import("@braccato/core/styles/instrumental.css"),
            import("@braccato/parsers"),
        ])
            .then(([, , , , parsers]) => {
                const parsed = parsers.TTMLParser.parse(lyrics);
                setParsedLyrics(parsed);
                setBraccatoReady(true);
            })
            .catch((err) => console.error("Failed to load braccato/parsers:", err));
    }, [lyrics, braccatoReady]);

    // Apply lyrics to the braccato element once both are ready
    useEffect(() => {
        const el = lyricsRef.current;
        if (!el || !braccatoReady || !parsedLyrics) return;
        el.lyrics = parsedLyrics;
    }, [braccatoReady, parsedLyrics]);

    // Advance braccato's playback via requestAnimationFrame — no audio needed
    useEffect(() => {
        const el = lyricsRef.current;
        if (!el || !braccatoReady) return;

        el.source = null;

        if (hasEnded) {
            el.currentTime = duration ?? playbackOffset;
            el.playing = false;
            return;
        }

        el.playing = true;

        const start = performance.now();
        let frame: number;

        const tick = (now: number) => {
            el.currentTime = playbackOffset + (now - start) / 1000;
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frame);
            el.playing = false;
        };
    }, [braccatoReady, duration, hasEnded, playbackOffset]);

    if (loading) {
        return (
            <section className="music-page__section current-song">
                <h2 className="current-song__header">listening to</h2>
                <div className="current-song__loading">loading…</div>
            </section>
        );
    }

    if (error || !metadata) {
        return null;
    }

    return (
        <section className="music-page__section current-song">
            <h2 className="current-song__header">{hasEnded ? "last listened" : "now playing"}</h2>

            <div className="current-song__card">
                <div className="current-song__card-info">
                    <img
                        className="current-song__cover"
                        src={metadata.coverImage}
                        alt={metadata.album}
                        onError={(event) => {
                            // Apple CDN artwork can occasionally fail independently
                            // of the metadata request. Keep the card usable.
                            if (fallbackCover && event.currentTarget.src !== fallbackCover) {
                                event.currentTarget.src = fallbackCover;
                            }
                        }}
                    />
                    <div className="current-song__titles">
                        {metadata.id ? (
                            <a
                                className="current-song__title"
                                href={`https://music.youtube.com/watch?v=${encodeURIComponent(metadata.id)}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {metadata.title}
                            </a>
                        ) : (
                            <span className="current-song__title">{metadata.title}</span>
                        )}
                        <span className="current-song__artist">{metadata.artist} <span className="current-song__dot">·</span> {metadata.album}</span>
                    </div>
                </div>

                <div className="current-song__lyrics-wrap">
                    {braccatoReady ? (
                        // @ts-expect-error braccato-lyrics is a custom element not in JSX.IntrinsicElements
                        <braccato-lyrics ref={lyricsRef} />
                    ) : (
                        <div className="current-song__lyrics-placeholder">loading lyrics…</div>
                    )}
                </div>

                <span className="current-song__subtitle">sorry for no audio, i might get in trouble if i do that :3</span>
            </div>
        </section>
    );
}

function Music() {
    const { pathname, hash } = useLocation();
    const { content, loading, error } = useSiteContent();

    useEffect(() => {
        if (hash) {
            if (hash === '#tracks') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const el = document.getElementById(hash.substring(1));
                if (el) {
                    // slight delay to let the page render first
                    setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
                }
            }
        } else {
            window.scrollTo(0, 0);
        }
    }, [pathname, hash]);

    if (!content) {
        return (
            <main className="music-page">
                <Link to="/" className="music-page__back">← back home</Link>
                <div className="music-page__header">
                    <h1 className="music-page__title">music</h1>
                    <p className="music-page__subtitle">{loading ? "loading…" : error}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="music-page">
            {/* Back button */}
            <Link to="/" className="music-page__back">
                <span className="music-page__back-arrow">←</span>
                back home
            </Link>

            {/* Page header */}
            <div className="music-page__header">
                <h1 className="music-page__title">music</h1>
                <p className="music-page__subtitle">
                    {content.music.subtitle}
                </p>
                <p className="music-page__warning">
                    {content.music.warning}
                </p>
                <hr className="music-page__divider" />
            </div>

            {/* Currently listening */}
            <CurrentSong />

            {/* Jump-links nav */}
            <nav className="music-page__nav">
                <a href="#tracks" className="music-page__nav-link">tracks</a>
                <span className="music-page__nav-dot">·</span>
                <a href="#albums" className="music-page__nav-link">albums</a>
            </nav>

            {/* ── Best Tracks ── */}
            <section className="music-page__section" id="tracks">
                <h2 className="music-page__section-title">tracks</h2>
                <div className="music-page__boxes">
                    {content.music.tracks.map((item: MusicTrack, i) => (
                        <MusicBox key={item.id} rank={i + 1} embedHeight={175} {...item} />
                    ))}
                </div>
            </section>

            {/* ── Best Albums ── */}
            <section className="music-page__section" id="albums">
                <h2 className="music-page__section-title">albums</h2>
                <div className="music-page__boxes">
                    {content.music.albums.map((item: MusicEntry, i) => (
                        <MusicBox key={item.id} rank={i + 1} embedHeight={450} {...item} />
                    ))}
                </div>
            </section>

        </main>
    );
}

export default Music;
