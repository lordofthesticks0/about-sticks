import { useContext } from "react";
import { SiteContentContext } from "./site-content-context.ts";
import type { SiteContentState } from "./site-content.ts";

export function useSiteContent(): SiteContentState {
    const state = useContext(SiteContentContext);
    if (!state) {
        throw new Error("useSiteContent must be used inside SiteContentProvider");
    }
    return state;
}
