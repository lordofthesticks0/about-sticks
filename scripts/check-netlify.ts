import { getStore } from "@netlify/blobs";

  const store = getStore({
    name: "about-sticks-content",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN,
  });

  const metadata = await store.get("current-song-metadata.json", {
    type: "json",
  });

  console.log(metadata);
