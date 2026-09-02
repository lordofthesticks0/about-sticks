import { createContext } from "react";
import type { SiteContentState } from "./site-content.ts";

export const SiteContentContext = createContext<SiteContentState | undefined>(undefined);
