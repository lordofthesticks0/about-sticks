import { useState, useEffect } from "react";
import fallbackData from "../../data/light-content-example.json";
import fallbackLyrics from "../../data/example.ttml?raw";

export interface CurrentSongMetadata {
    title: string;
    artist: string;
    album: string;
    coverImage: string;
}

/** Raw shape from light-content-example.json */
interface RawNowPlaying {
    id?: string;
    title: string;
    artist: string;
    album: string;
    artworkUrl: string;
    duration?: number;
    albumId?: string;
    syncType?: string;
}

export interface CurrentSongState {
    metadata: CurrentSongMetadata | null;
    lyrics: string | null;
    loading: boolean;
    error: string | null;
}

export function useCurrentSong(): CurrentSongState {
    const [state, setState] = useState<CurrentSongState>({
        metadata: null,
        lyrics: null,
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
                    loading: false,
                    error: null,
                }),
            )
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return;
                console.warn("Current song is unavailable; using committed fallback.", error);
                const raw = fallbackData.nowPlaying as RawNowPlaying | undefined;
                setState({
                    metadata: raw
                        ? { title: raw.title, artist: raw.artist, album: raw.album, coverImage: raw.artworkUrl }
                        : null,
                    lyrics: fallbackLyrics,
                    loading: false,
                    error: null,
                });
            });

        return () => controller.abort();
    }, []);

    return state;
}
