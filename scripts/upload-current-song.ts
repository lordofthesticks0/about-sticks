const STORE_NAME = "about-sticks-content";
const METADATA_KEY = "current-song-metadata.json";
const LYRICS_KEY = "current-song-lyrics.ttml";
const API_BASE_URL = "https://api.netlify.com";

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

async function uploadBlob(
    blobPath: string,
    body: string,
    contentType: string,
    authToken: string,
    operationLabel: string,
): Promise<void> {
    const signedUrlResponse = await fetch(`${API_BASE_URL}/api/v1/blobs/${blobPath}`, {
        method: "PUT",
        headers: {
            Accept: "application/json;type=signed-url",
            Authorization: `Bearer ${authToken}`,
        },
    });
    await assertOk(signedUrlResponse, `Requesting Blobs upload URL for ${operationLabel}`);

    const signedUrlData = (await signedUrlResponse.json()) as { url?: unknown };
    if (typeof signedUrlData.url !== "string" || signedUrlData.url.length === 0) {
        throw new Error(`Netlify returned an invalid Blobs upload URL for ${operationLabel}`);
    }

    const uploadResponse = await fetch(signedUrlData.url, {
        method: "PUT",
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "max-age=0, stale-while-revalidate=60",
        },
        body,
    });
    await assertOk(uploadResponse, `Uploading ${operationLabel}`);
}

const siteId = requiredEnv("NETLIFY_SITE_ID");
const authToken = requiredEnv("NETLIFY_AUTH_TOKEN");
const metadataPath = Bun.argv[2] ?? "data/current-song-metadata.json";
const lyricsPath = Bun.argv[3] ?? "data/current-song-lyrics.ttml";

const metadataContent = await Bun.file(metadataPath).text();
let metadata: Record<string, unknown>;
try {
    metadata = JSON.parse(metadataContent);
} catch {
    throw new Error(`Invalid metadata JSON in ${metadataPath}`);
}

const lyricsContent = await Bun.file(lyricsPath).text();

const blobBase = [
    encodeURIComponent(siteId),
    encodeURIComponent(`site:${STORE_NAME}`),
].join("/");

await uploadBlob(
    `${blobBase}/${encodeURIComponent(METADATA_KEY)}`,
    JSON.stringify(metadata),
    "application/json",
    authToken,
    "metadata",
);

await uploadBlob(
    `${blobBase}/${encodeURIComponent(LYRICS_KEY)}`,
    lyricsContent,
    "application/xml",
    authToken,
    "lyrics",
);

console.log(`Uploaded current song from ${metadataPath} and ${lyricsPath}`);
