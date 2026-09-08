const { builder } = require("@netlify/functions");
const { connectLambda, getStore } = require("@netlify/blobs");

const STORE_NAME = "about-sticks-content";
const CONTENT_KEY = "site-content.json";

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

    const content = await getStore(STORE_NAME).get(CONTENT_KEY, {
      type: "json",
    });

    if (content === null) {
      return {
        statusCode: 404,
        ttl: 0,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
        body: JSON.stringify({ error: `Missing blob: ${CONTENT_KEY}` }),
      };
    }

    return {
      statusCode: 200,
      ttl: 0,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
      body: JSON.stringify(content),
    };
  } catch (error) {
    console.error("Could not read site content blob", error);
    return {
      statusCode: 500,
      ttl: 0,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
      body: JSON.stringify({ error: "Could not read site content" }),
    };
  }
}

exports.handler = builder(handler);
