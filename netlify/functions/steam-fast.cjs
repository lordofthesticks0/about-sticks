const { builder } = require("@netlify/functions");
/**
 * steam-fast — Fast Data Proxy
 *
 * Fetches frequently-changing data from the Steam API:
 *   1. Playtime (total + per-game for 10 requested games)
 *
 * Path format:
 *   /.netlify/functions/steam-fast/:steamid/:appids
 *   where appids is a comma-separated list
 *
 * Cache: 5 minutes (public, s-maxage=300)
 */

const API_KEY = process.env.STEAM_API_KEY;

/* ── handler ─────────────────────────────────────────── */

async function handler(event, context) {
  // Parse path segments: /steam-fast/:steamid/:appids
  const segments = event.path.replace(/^\/\.netlify\/functions\/steam-fast\/?/, "").split("/");
  const steamid = segments[0] || "";
  const appids = segments[1] || "";

  if (!steamid || !appids) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing path params. Use: /steam-fast/:steamid/:appids" }),
    };
  }

  const appIdList = appids.split(",").map((id) => id.trim());

  // ── Playtime (all owned games) ─────────────────────────
  const playtime = await fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamid}`
  )
    .then((res) => res.json())
    .then((data) => {
      const games = data?.response?.games || [];

      // Total playtime across every owned game (in minutes to hours)
      const totalMinutes = games.reduce(
        (sum, g) => sum + (g.playtime_forever || 0),
        0
      );

      // Per-game playtime for the requested 10 (minutes to hours)
      const gamePlaytimes = {};
      for (const id of appIdList) {
        const found = games.find((g) => String(g.appid) === id);
        gamePlaytimes[id] = found ? found.playtime_forever : 0;
      }

      return { totalMinutes, gamePlaytimes };
    })
    .catch(() => null);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      totalPlaytime: playtime ? playtime.totalMinutes : null,
      gamePlaytimes: playtime ? playtime.gamePlaytimes : null,
    }),
  };
}

exports.handler = builder(handler);
