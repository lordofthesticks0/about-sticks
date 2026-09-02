const { builder } = require("@netlify/functions");
const { getStore } = require("@netlify/blobs");

const STORE_NAME = "about-sticks-content";
const CONTENT_KEY = "site-content.json";

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStrings(value, fields) {
  return isRecord(value) && fields.every((field) => typeof value[field] === "string");
}

function isValidSiteContent(value) {
  if (!isRecord(value) || value.schemaVersion !== 1) return false;

  const homeValid = hasStrings(value.home, ["avatarUrl", "avatarAlt", "title", "subtitle", "subsubtitle"]);
  const categoriesValid = Array.isArray(value.categories) && value.categories.every((category) =>
    hasStrings(category, ["name", "color", "path"])
  );
  const musicValid = isRecord(value.music) &&
    hasStrings(value.music, ["subtitle", "warning"]) &&
    Array.isArray(value.music.tracks) &&
    Array.isArray(value.music.albums) &&
    Array.isArray(value.music.artists) &&
    value.music.tracks.every((entry) => hasStrings(entry, ["id", "title", "artist", "description", "link"])) &&
    value.music.albums.every((entry) => hasStrings(entry, ["id", "title", "artist", "description", "link"])) &&
    value.music.artists.every((entry) => hasStrings(entry, ["id", "title", "description", "image"]));
  const gamesValid = isRecord(value.games) &&
    hasStrings(value.games, ["steamId", "title", "subtitle"]) &&
    Array.isArray(value.games.items) &&
    value.games.items.every((game) =>
      isRecord(game) && Number.isInteger(game.appId) && hasStrings(game, ["title", "description"])
    );
  const steamProfileValid = value.steam?.profile === null || (
    hasStrings(value.steam?.profile, ["personaname", "avatarfull", "timeSinceCreation"]) &&
    typeof value.steam.profile.timecreated === "number"
  );
  const steamValid = isRecord(value.steam) &&
    steamProfileValid &&
    isRecord(value.steam.achievements) &&
    (value.steam.prices === null || isRecord(value.steam.prices)) &&
    (value.steam.profileItems === null || isRecord(value.steam.profileItems));

  return homeValid && categoriesValid && musicValid && gamesValid && steamValid;
}

async function handler(event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { Allow: "GET" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const content = await getStore(STORE_NAME).get(CONTENT_KEY, {
      consistency: "strong",
      type: "json",
    });

    if (content === null) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Missing blob: ${CONTENT_KEY}` }),
      };
    }

    if (!isValidSiteContent(content)) {
      console.error(`Invalid site content in ${STORE_NAME}/${CONTENT_KEY}`);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Site content has an invalid schema" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      },
      body: JSON.stringify(content),
    };
  } catch (error) {
    console.error("Could not read site content blob", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not read site content" }),
    };
  }
}

exports.handler = builder(handler);
