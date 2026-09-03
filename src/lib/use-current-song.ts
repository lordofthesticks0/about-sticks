import { useState, useEffect } from "react";
import fallbackData from "../../data/light-content-example.json";
import fallbackLyrics from "../../data/example.ttml?raw";

export interface CurrentSongMetadata {
    title: string;
    artist: string;
    album: string;
    coverImage: string;
    duration?: number;
    uploadedAt?: string;
}

/** Raw shape from light-content-example.json */
interface RawNowPlaying {
    id?: string;
    title: string;
    artist: string;
    album: string;
    artworkUrl: string;
    duration?: number;
    uploadedAt?: string;
    albumId?: string;
    syncType?: string;
}

export interface CurrentSongState {
    metadata: CurrentSongMetadata | null;
    lyrics: string | null;
    loadedAt: number | null;
    loading: boolean;
    error: string | null;
}

export function useCurrentSong(): CurrentSongState {
    const [state, setState] = useState<CurrentSongState>({
        metadata: null,
        lyrics: null,
        loadedAt: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        const controller = new AbortController();

        fetch("/.netlify/functions/current-song", { signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Current song request failed (${response.status})`);
                }
                return response.json() as Promise<{
                    metadata: CurrentSongMetadata;
                    lyrics: string;
                }>;
            })
            .then((data) =>
                setState({
                    metadata: data.metadata,
                    lyrics: data.lyrics,
                    loadedAt: Date.now(),
                    loading: false,
                    error: null,
                }),
            )
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return;
                console.warn("Current song is unavailable; using committed fallback.", error);
                const raw = fallbackData.nowPlaying as RawNowPlaying | undefined;
                const fallbackLoadedAt = Date.now();
                setState({
                    metadata: raw
                        ? {
                              title: raw.title,
                              artist: raw.artist,
                              album: raw.album,
                              coverImage: raw.artworkUrl,
                              duration: raw.duration,
                              uploadedAt: raw.uploadedAt,
                          }
                        : null,
                    lyrics: fallbackLyrics,
                    loadedAt: fallbackLoadedAt,
                    loading: false,
                    error: null,
                });
            });

        return () => controller.abort();
    }, []);

    return state;
}
