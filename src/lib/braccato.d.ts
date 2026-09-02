// Ambient declarations for braccato lyric types.
// No import/export so these are script-level (global).

interface BraccatoLyricPart {
    startTimeMs: number;
    words: string;
    durationMs: number;
    isBackground?: boolean;
}

interface BraccatoLyric {
    startTimeMs: number;
    words: string;
    durationMs: number;
    parts?: BraccatoLyricPart[];
    isInstrumental?: boolean;
}

interface BraccatoLyricsElement extends HTMLElement {
    lyrics: BraccatoLyric[] | null;
    source: string | HTMLMediaElement | null;
    currentTime: number;
    playing: boolean;
    readonly mediaElement: HTMLMediaElement | null;
    readonly status: string;
}
