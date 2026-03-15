const { builder } = require("@netlify/functions");
/**
 * steam-heavy — Heavy Data Proxy
 *
 * Fetches expensive / rarely-changing data from the Steam API:
 *   1. User profile (display name, avatar, account creation time)
 *   2. Achievement percentages for each of the 10 requested games
 *   3. Pricing in IDR for the 10 requested games
 *   4. Equipped profile items (background, avatar frame, etc.)
 *
 * Path format:
 *   /.netlify/functions/steam-heavy/:steamid/:appids
 *   where appids is a comma-separated list
 *
 * Cache: 24 hours (public, s-maxage=86400)
 */

const API_KEY = process.env.STEAM_API_KEY;

const CDN_BASE = "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/";

/* ── helpers ─────────────────────────────────────────── */

/**
 * Converts a Unix timestamp into a human-readable "X years, Y days" string.
 */
function timeSinceCreation(unixTimestamp) {
  const created = new Date(unixTimestamp * 1000);
  const now = new Date();

  let years = now.getFullYear() - created.getFullYear();
  let days = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()) -
      new Date(now.getFullYear(), created.getMonth(), created.getDate())) /
    (1000 * 60 * 60 * 24)
  );

  if (days < 0) {
    years -= 1;
    const lastAnniversary = new Date(
      now.getFullYear() - 1,
      created.getMonth(),
      created.getDate()
    );
    days = Math.floor((now - lastAnniversary) / (1000 * 60 * 60 * 24));
  }

  const parts = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  return parts.join(", ") || "0 days";
}

/**
 * Given a profile item object from GetProfileItemsEquipped, extract
 * the best media URL. Prefer movie_webm (non-small), then image_large.
 * Pass preferSmall=true to use image_small instead of image_large
 * (e.g. avatar_frame, where image_small is animated but image_large is not).
 * Returns a full CDN URL or null.
 */
function extractItemUrl(item, preferSmall = false) {
  if (!item || Object.keys(item).length === 0) return null;

  // Prefer WEBM video (non-small) when available
  if (item.movie_webm) return CDN_BASE + item.movie_webm;
  // Use small image if requested (e.g. animated avatar frames)
  if (preferSmall && item.image_small) return CDN_BASE + item.image_small;
  // Fall back to the large static image
  if (item.image_large) return CDN_BASE + item.image_large;

  return null;
}

/* ── handler ─────────────────────────────────────────── */

async function handler(event, context) {
  // Parse path segments: /steam-heavy/:steamid/:appids
  const segments = event.path.replace(/^\/\.netlify\/functions\/steam-heavy\/?/, "").split("/");
  const steamid = segments[0] || "";
  const appids = segments[1] || "";

  if (!steamid || !appids) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing path params. Use: /steam-heavy/:steamid/:appids" }),
    };
  }

  const appIdList = appids.split(",").map((id) => id.trim());

  // ── 1. User Profile ──────────────────────────────────
  const profilePromise = fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${API_KEY}&steamids=${steamid}`
  )
    .then((res) => res.json())
    .then((data) => {
      const player = data?.response?.players?.[0];
      if (!player) return null;
      return {
        personaname: player.personaname,
        avatarfull: player.avatarfull,
        timecreated: player.timecreated,
        timeSinceCreation: timeSinceCreation(player.timecreated),
      };
    })
    .catch(() => null);

  // ── 2. Achievements (10 requests) ─────────────────────
  const achievementPromises = appIdList.map((appId) =>
    fetch(
      `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${API_KEY}&steamid=${steamid}`
    )
      .then((res) => res.json())
      .then((data) => {
        const achievements = data?.playerstats?.achievements;
        if (!achievements || achievements.length === 0) return { appId, percentage: null };

        const achieved = achievements.filter((a) => a.achieved === 1).length;
        const percentage = (achieved / achievements.length) * 100;
        return { appId, percentage: Math.round(percentage * 100) / 100 };
      })
      .catch(() => ({ appId, percentage: null }))
  );

  // ── 3. Pricing (IDR) ─────────────────────────────────
  const pricingPromise = fetch(
    `https://store.steampowered.com/api/appdetails/?appids=${appids}&cc=id&filters=price_overview`
  )
    .then((res) => res.json())
    .then((data) => {
      const prices = {};
      for (const id of appIdList) {
        const entry = data?.[id];
        if (entry?.success && entry.data?.price_overview) {
          const po = entry.data.price_overview;
          prices[id] = {
            initial: po.initial / 100,
            final: po.final / 100,
            discount_percent: po.discount_percent,
          };
        } else {
          // Free-to-play or no price data
          prices[id] = null;
        }
      }
      return prices;
    })
    .catch(() => null);

  // ── 4. Equipped Profile Items ─────────────────────────
  const profileItemsPromise = fetch(
    `https://api.steampowered.com/IPlayerService/GetProfileItemsEquipped/v1/?key=${API_KEY}&steamid=${steamid}`
  )
    .then((res) => res.json())
    .then((data) => {
      const r = data?.response;
      if (!r) return null;
      return {
        profile_background: extractItemUrl(r.profile_background),
        mini_profile_background: extractItemUrl(r.mini_profile_background),
        avatar_frame: extractItemUrl(r.avatar_frame, true), // image_small is animated
        animated_avatar: extractItemUrl(r.animated_avatar),
        profile_modifier: extractItemUrl(r.profile_modifier),
        steam_deck_keyboard_skin: extractItemUrl(r.steam_deck_keyboard_skin),
      };
    })
    .catch(() => null);

  // ── Execute all concurrently ──────────────────────────
  const [profile, prices, profileItems, ...achievementResults] = await Promise.all([
    profilePromise,
    pricingPromise,
    profileItemsPromise,
    ...achievementPromises,
  ]);

  // Build keyed achievements object
  const achievements = {};
  for (const r of achievementResults) {
    achievements[r.appId] = r.percentage;
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      profile,
      achievements,
      prices,
      profileItems,
    }),
  };
}

exports.handler = builder(handler);
