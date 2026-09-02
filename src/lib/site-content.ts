export interface HomeContent {
    avatarUrl: string;
    avatarAlt: string;
    title: string;
    subtitle: string;
    subsubtitle: string;
}

export interface CategoryContent {
    name: string;
    color: string;
    path: string;
}

export interface MusicEntry {
    id: string;
    title: string;
    artist: string;
    description: string;
    link: string;
}

export interface MusicArtist {
    id: string;
    title: string;
    description: string;
    image: string;
}

export interface GameContent {
    appId: number;
    title: string;
    description: string;
}

export interface SteamProfile {
    personaname: string;
    avatarfull: string;
    timecreated: number;
    timeSinceCreation: string;
}

export interface SteamProfileItems {
    profile_background: string | null;
    mini_profile_background: string | null;
    avatar_frame: string | null;
    animated_avatar: string | null;
    profile_modifier: string | null;
    steam_deck_keyboard_skin: string | null;
}

export interface SteamHeavyData {
    profile: SteamProfile | null;
    achievements: Record<string, number | null>;
    prices: Record<string, { initial: number; final: number; discount_percent: number } | null> | null;
    profileItems: SteamProfileItems | null;
}

export interface SiteContent {
    schemaVersion: 1;
    home: HomeContent;
    categories: CategoryContent[];
    music: {
        subtitle: string;
        warning: string;
        tracks: MusicEntry[];
        albums: MusicEntry[];
        artists: MusicArtist[];
    };
    games: {
        steamId: string;
        title: string;
        subtitle: string;
        items: GameContent[];
    };
    steam: SteamHeavyData;
}

export interface SiteContentState {
    content: SiteContent | null;
    loading: boolean;
    error: string | null;
}
