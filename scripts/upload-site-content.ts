import { parse } from "yaml";

const STORE_NAME = "about-sticks-content";
const CONTENT_KEY = "site-content.json";
const API_BASE_URL = "https://api.netlify.com";
const STEAM_CDN_BASE = "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/";

interface SourceContent {
    schemaVersion?: unknown;
    games: {
        steamId: string;
        items: Array<{ appId: number }>;
    };
    [key: string]: unknown;
}

interface SteamHeavyData {
    profile: {
        personaname: string;
        avatarfull: string;
        timecreated: number;
        timeSinceCreation: string;
    } | null;
    achievements: Record<string, number | null>;
    prices: Record<string, { initial: number; final: number; discount_percent: number } | null> | null;
    profileItems: {
        profile_background: string | null;
        mini_profile_background: string | null;
        avatar_frame: string | null;
        animated_avatar: string | null;
        profile_modifier: string | null;
        steam_deck_keyboard_skin: string | null;
    } | null;
}

function requiredEnv(name: string): string {
    const value = Bun.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

async function assertOk(response: Response, operation: string): Promise<void> {
    if (response.ok) return;
    const details = await response.text();
    throw new Error(`${operation} failed (${response.status}): ${details}`);
}

function timeSinceCreation(unixTimestamp: number): string {
    const created = new Date(unixTimestamp * 1000);
    const now = new Date();

    let years = now.getFullYear() - created.getFullYear();
    let days = Math.floor(
        (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
            new Date(now.getFullYear(), created.getMonth(), created.getDate()).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (days < 0) {
        years -= 1;
        const lastAnniversary = new Date(now.getFullYear() - 1, created.getMonth(), created.getDate());
        days = Math.floor((now.getTime() - lastAnniversary.getTime()) / (1000 * 60 * 60 * 24));
    }

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    return parts.join(", ") || "0 days";
}

function extractItemUrl(item: Record<string, unknown> | undefined, preferSmall = false): string | null {
    if (!item || Object.keys(item).length === 0) return null;
    if (typeof item.movie_webm === "string") return STEAM_CDN_BASE + item.movie_webm;
    if (preferSmall && typeof item.image_small === "string") return STEAM_CDN_BASE + item.image_small;
    if (typeof item.image_large === "string") return STEAM_CDN_BASE + item.image_large;
    return null;
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Steam request failed (${response.status})`);
    return response.json() as Promise<T>;
}

async function fetchSteamSnapshot(games: SourceContent["games"], apiKey: string): Promise<SteamHeavyData> {
    const appIdList = games.items.map((game) => String(game.appId));
    const appIds = appIdList.join(",");

    const profilePromise = fetchJson<{ response?: { players?: Array<Record<string, unknown>> } }>(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(apiKey)}&steamids=${encodeURIComponent(games.steamId)}`,
    )
        .then((data) => {
            const player = data.response?.players?.[0];
            if (!player || typeof player.personaname !== "string" || typeof player.avatarfull !== "string" || typeof player.timecreated !== "number") return null;
            return {
                personaname: player.personaname,
                avatarfull: player.avatarfull,
                timecreated: player.timecreated,
                timeSinceCreation: timeSinceCreation(player.timecreated),
            };
        })
        .catch(() => null);

    const achievementPromises = appIdList.map((appId) =>
        fetchJson<{ playerstats?: { achievements?: Array<{ achieved: number }> } }>(
            `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${encodeURIComponent(apiKey)}&steamid=${encodeURIComponent(games.steamId)}`,
        )
            .then((data) => {
                const achievements = data.playerstats?.achievements;
                if (!achievements || achievements.length === 0) return { appId, percentage: null };
                const achieved = achievements.filter((achievement) => achievement.achieved === 1).length;
                return { appId, percentage: Math.round((achieved / achievements.length) * 10000) / 100 };
            })
            .catch(() => ({ appId, percentage: null })),
    );

    const pricingPromise = fetchJson<Record<string, {
        success?: boolean;
        data?: { price_overview?: { initial: number; final: number; discount_percent: number } };
    }>>(
        `https://store.steampowered.com/api/appdetails/?appids=${appIds}&cc=id&filters=price_overview`,
    )
        .then((data) => {
            const prices: NonNullable<SteamHeavyData["prices"]> = {};
            for (const appId of appIdList) {
                const priceOverview = data[appId]?.success ? data[appId].data?.price_overview : undefined;
                prices[appId] = priceOverview
                    ? {
                        initial: priceOverview.initial / 100,
                        final: priceOverview.final / 100,
                        discount_percent: priceOverview.discount_percent,
                    }
                    : null;
            }
            return prices;
        })
        .catch(() => null);

    const profileItemsPromise = fetchJson<{ response?: Record<string, Record<string, unknown>> }>(
        `https://api.steampowered.com/IPlayerService/GetProfileItemsEquipped/v1/?key=${encodeURIComponent(apiKey)}&steamid=${encodeURIComponent(games.steamId)}`,
    )
        .then((data) => {
            const items = data.response;
            if (!items) return null;
            return {
                profile_background: extractItemUrl(items.profile_background),
                mini_profile_background: extractItemUrl(items.mini_profile_background),
                avatar_frame: extractItemUrl(items.avatar_frame, true),
                animated_avatar: extractItemUrl(items.animated_avatar),
                profile_modifier: extractItemUrl(items.profile_modifier),
                steam_deck_keyboard_skin: extractItemUrl(items.steam_deck_keyboard_skin),
            };
        })
        .catch(() => null);

    const [profile, prices, profileItems, achievementResults] = await Promise.all([
        profilePromise,
        pricingPromise,
        profileItemsPromise,
        Promise.all(achievementPromises),
    ]);

    const achievements: Record<string, number | null> = {};
    for (const result of achievementResults) achievements[result.appId] = result.percentage;

    return { profile, achievements, prices, profileItems };
}

const siteId = requiredEnv("NETLIFY_SITE_ID");
const authToken = requiredEnv("NETLIFY_AUTH_TOKEN");
const steamApiKey = requiredEnv("STEAM_API_KEY");
const inputPath = Bun.argv[2] ?? "data/site-content.example.yaml";
const yamlContent = await Bun.file(inputPath).text();
let parsedContent: SourceContent;

try {
    parsedContent = parse(yamlContent) as SourceContent;
    if (parsedContent.schemaVersion !== 1) throw new Error("The content file must have schemaVersion: 1");
    if (!parsedContent.games?.steamId || !Array.isArray(parsedContent.games?.items) || parsedContent.games.items.length === 0) {
        throw new Error("The content file must include games.steamId and at least one games.items entry");
    }
} catch (error) {
    throw new Error(`Invalid content YAML: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
}

const steam = await fetchSteamSnapshot(parsedContent.games, steamApiKey);
const content = JSON.stringify({ ...parsedContent, steam });
const blobPath = [
    encodeURIComponent(siteId),
    `site:${encodeURIComponent(STORE_NAME)}`,
    encodeURIComponent(CONTENT_KEY),
].join("/");

// Netlify's Blobs API returns a signed URL for writes. The first request is
// authenticated; the JSON payload is sent directly to the signed URL next.
const signedUrlResponse = await fetch(`${API_BASE_URL}/api/v1/blobs/${blobPath}`, {
    method: "PUT",
    headers: {
        Accept: "application/json;type=signed-url",
        Authorization: `Bearer ${authToken}`,
    },
});
await assertOk(signedUrlResponse, "Requesting a Blobs upload URL");

const signedUrlData = await signedUrlResponse.json() as { url?: unknown };
if (typeof signedUrlData.url !== "string" || signedUrlData.url.length === 0) {
    throw new Error("Netlify returned an invalid Blobs upload URL");
}

const uploadResponse = await fetch(signedUrlData.url, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=0, stale-while-revalidate=60",
    },
    body: content,
});
await assertOk(uploadResponse, "Uploading site content");

console.log(`Uploaded ${inputPath} and refreshed the Steam snapshot in ${STORE_NAME}/${CONTENT_KEY}`);
