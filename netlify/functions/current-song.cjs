const { builder } = require("@netlify/functions");
const { connectLambda, getStore } = require("@netlify/blobs");

const STORE_NAME = "about-sticks-content";
const METADATA_KEY = "current-song-metadata.json";
const LYRICS_KEY = "current-song-lyrics.ttml";

async function handler(event) {
    if (event.httpMethod !== "GET") {
        return {
            statusCode: 405,
            headers: { Allow: "GET" },
            body: JSON.stringify({ error: "Method not allowed" }),
        };
    }

    try {
        // These CommonJS handlers run in Lambda compatibility mode, so initialize
        // the Blobs context from the Netlify event before opening the store.
        connectLambda(event);

        const store = getStore(STORE_NAME);

        const metadata = await store.get(METADATA_KEY, {
            type: "json",
        });

        if (metadata === null) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: `Missing blob: ${METADATA_KEY}` }),
            };
        }

        const lyrics = await store.get(LYRICS_KEY, {
            type: "text",
        });

        if (lyrics === null) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: `Missing blob: ${LYRICS_KEY}` }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
            },
            body: JSON.stringify({ metadata, lyrics }),
        };
    } catch (error) {
        console.error("Could not read current song blobs", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Could not read current song data" }),
        };
    }
}

exports.handler = builder(handler);
