import { parse } from "yaml";
import { useEffect, useState, type ReactNode } from "react";
import { SiteContentContext } from "./site-content-context.ts";
import type { SiteContent, SiteContentState, SteamHeavyData } from "./site-content.ts";
import fallbackYaml from "../../data/site-content.example.yaml?raw";

const EMPTY_STEAM_DATA: SteamHeavyData = {
    profile: null,
    achievements: {},
    prices: null,
    profileItems: null,
};

const FALLBACK_CONTENT: SiteContent = {
    ...(parse(fallbackYaml) as Omit<SiteContent, "steam">),
    steam: EMPTY_STEAM_DATA,
};

export function SiteContentProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<SiteContentState>({
        content: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        const controller = new AbortController();

        // The content blob can be updated independently of a frontend deploy.
        // Bypass both the browser cache and any intermediary cache on every app
        // load so pages never render an older uploaded version.
        fetch(`/.netlify/functions/site-content?refresh=${Date.now()}`, {
            signal: controller.signal,
            cache: "no-store",
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Content request failed (${response.status})`);
                }
                return response.json() as Promise<SiteContent>;
            })
            .then((content) => setState({ content, loading: false, error: null }))
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return;
                console.warn("Site content is unavailable; using the committed YAML fallback.", error);
                setState({
                    content: FALLBACK_CONTENT,
                    loading: false,
                    error: null,
                });
            });

        return () => controller.abort();
    }, []);

    return <SiteContentContext.Provider value={state}>{children}</SiteContentContext.Provider>;
}
