# Netlify Blobs content

The editable site content is stored in a site-wide Netlify Blobs store:

- Store: `about-sticks-content`
- Key: `site-content.json`
- Reader endpoint: `/.netlify/functions/site-content`

The committed file [`data/site-content.example.yaml`](../data/site-content.example.yaml) is the starter document and schema example. The Bun uploader parses it as YAML and sends the resulting JSON to Blobs, and the frontend also uses it as a local fallback when the Blobs endpoint cannot be reached.

If the content endpoint is unavailable—for example, when running Vite without Netlify Dev—the frontend parses this committed YAML file and uses it as a local fallback. The fallback has no generated Steam snapshot, so the Games page will show unavailable slow Steam values until the blob is uploaded; the fast playtime request remains separate.

## Upload or update the content

1. Edit `data/site-content.example.yaml` locally.
2. Set these environment variables in your shell. Do not commit the tokens:

   ```powershell
   $env:NETLIFY_SITE_ID = "your-project-id"
   $env:NETLIFY_AUTH_TOKEN = "your-personal-access-token"
   $env:STEAM_API_KEY = "your-steam-api-key"
   ```

   `NETLIFY_SITE_ID` is the Project ID shown in Netlify under **Project configuration → General → Project information**. `NETLIFY_AUTH_TOKEN` is a Netlify personal access token with access to the site. `STEAM_API_KEY` is the Steam Web API key used to refresh the slow snapshot.

3. Run the Bun uploader:

   ```bash
   bun run content:upload
   ```

   To upload another compatible YAML file, pass its path:

   ```bash
   bun run content:upload -- ./path/to/site-content.yaml
   ```

The uploader first polls the slow Steam data sources (profile, achievements, prices, and equipped profile items), adds the result as the generated `steam` property, and then uses Netlify's raw HTTP Blobs protocol: an authenticated request obtains a signed upload URL, then the JSON is sent to that URL. The protocol uses `PUT` for both requests; no Netlify CLI or Blobs SDK is involved. You normally should not add or edit `steam` in the YAML source. You can inspect or download the live value from the Netlify UI under **Data & Storage → Blobs**. Changes are served through the content function with a short edge cache, so allow roughly a minute for an update to appear everywhere.

## Expected schema

The YAML root must have `schemaVersion: 1`, plus `home`, `categories`, `music`, and `games`. The uploader adds the generated `steam` object to the JSON blob before uploading it.

```ts
interface SiteContent {
  schemaVersion: 1;
  home: {
    avatarUrl: string;
    avatarAlt: string;
    title: string;
    subtitle: string;
    subsubtitle: string;
  };
  categories: Array<{
    name: string;
    color: string; // CSS color
    path: string; // internal route, e.g. "/music"
  }>;
  music: {
    subtitle: string;
    warning: string;
    tracks: MusicEntry[];
    albums: MusicEntry[];
    artists: Array<{
      id: string;
      title: string;
      description: string;
      image: string;
    }>;
  };
  games: {
    steamId: string;
    title: string;
    subtitle: string;
    items: Array<{
      appId: number;
      title: string;
      description: string;
    }>;
  };
  steam: {
    profile: {
      personaname: string;
      avatarfull: string;
      timecreated: number;
      timeSinceCreation: string;
    } | null;
    achievements: Record<string, number | null>;
    prices: Record<string, {
      initial: number;
      final: number;
      discount_percent: number;
    } | null> | null;
    profileItems: Record<string, string | null> | null;
  };
}

interface MusicEntry {
  id: string;
  title: string;
  artist: string;
  description: string;
  link: string; // normal Apple Music share URL
}
```

Array order is display order and determines the visible rank. `games.items[].appId` must be a numeric Steam app ID; the existing Steam functions use the values to request playtime, achievements, and prices.
