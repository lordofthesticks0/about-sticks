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

    const content = await getStore(STORE_NAME, { consistency: "strong" }).get(CONTENT_KEY, {
        type: "json",
    });

    if (content === null) {
      return {
        statusCode: 404,
        headers: {
          "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
          "Netlify-CDN-Cache-Control": "no-store",
        },
        body: JSON.stringify({ error: `Missing blob: ${CONTENT_KEY}` }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "no-store",
      },
      body: JSON.stringify(content),
    };
  } catch (error) {
    console.error("Could not read site content blob", error);
    return {
      statusCode: 500,
      headers: {
        "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "no-store",
      },
      body: JSON.stringify({ error: "Could not read site content" }),
    };
  }
}

exports.handler = handler;
