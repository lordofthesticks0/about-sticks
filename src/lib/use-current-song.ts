import { useState, useEffect, useCallback, useRef } from "react";
import fallbackData from "../../data/light-content-example.json";
import fallbackLyrics from "../../data/example.ttml?raw";

export interface CurrentSongMetadata {
    id?: string;
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
    artworkUrl?: string;
    artwork_url?: string;
    duration?: number;
    uploadedAt?: string;
    uploaded_at?: string;
    albumId?: string;
    album_id?: string;
    syncType?: string;
    sync_type?: number | string;
}

function normalizeMetadata(raw: RawNowPlaying): CurrentSongMetadata {
    return {
        id: raw.id,
        title: raw.title,
        artist: raw.artist,
        album: raw.album,
        // The current-song uploader stores the source API's snake_case keys,
        // while the local fallback uses camelCase. Accept both at this boundary.
        coverImage: raw.artworkUrl ?? raw.artwork_url ?? "",
        duration: raw.duration,
        uploadedAt: raw.uploadedAt ?? raw.uploaded_at,
    };
}

export interface CurrentSongState {
    metadata: CurrentSongMetadata | null;
    lyrics: string | null;
    loadedAt: number | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<boolean>;
}

export function useCurrentSong(): CurrentSongState {
    const [state, setState] = useState<Omit<CurrentSongState, "refresh">>({
        metadata: null,
        lyrics: null,
        loadedAt: null,
        loading: true,
        error: null,
    });
    const currentPayload = useRef<string | null>(null);
    const refresh = useCallback(async (useFallback = false): Promise<boolean> => {
        try {
            const response = await fetch(`/.netlify/functions/current-song?refresh=${Date.now()}`, {
                cache: "no-store",
            });
            if (!response.ok) {
                throw new Error(`Current song request failed (${response.status})`);
            }

            const data = await response.json() as {
                metadata: RawNowPlaying;
                lyrics: string;
            };
            const metadata = normalizeMetadata(data.metadata);
            const payload = JSON.stringify({ metadata, lyrics: data.lyrics });

            // Keep the original loadedAt when nothing changed. This preserves
            // the finished state instead of restarting the same song.
            if (currentPayload.current === payload) return false;

            currentPayload.current = payload;
            setState((previous) => ({
                ...previous,
                metadata,
                lyrics: data.lyrics,
                loadedAt: Date.now(),
                loading: false,
                error: null,
            }));
            return true;
        } catch (error: unknown) {
            if (useFallback) {
                if (error instanceof DOMException && error.name === "AbortError") return false;
                console.warn("Current song is unavailable; using committed fallback.", error);
                const raw = fallbackData.nowPlaying as RawNowPlaying | undefined;
                const metadata = raw ? normalizeMetadata(raw) : null;
                currentPayload.current = JSON.stringify({ metadata, lyrics: fallbackLyrics });
                setState((previous) => ({
                    ...previous,
                    metadata,
                    lyrics: fallbackLyrics,
                    loadedAt: Date.now(),
                    loading: false,
                    error: null,
                }));
            }
            return false;
        }
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void refresh(true);
        }, 0);
        return () => window.clearTimeout(timeout);
    }, [refresh]);

    return { ...state, refresh };
}
