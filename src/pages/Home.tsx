import { useEffect } from "react";
import { Kawarp, useKawarp } from "@kawarp/react";
import Favourites from "../components/Favourites.tsx";
import { useSiteContent } from "../lib/use-site-content.ts";

type RgbColor = [number, number, number];

function toKawarpRgb([red, green, blue]: RgbColor): RgbColor {
    return [red, green, blue].map((channel) => Math.max(0, Math.min(255, channel)) / 255) as RgbColor;
}

// Keep the visual tuning in one place so the background can be adjusted without
// having to touch the page layout below.
const KAWARP_OPTIONS = {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Genderfluidity_Pride-Flag.svg/120px-Genderfluidity_Pride-Flag.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail",
    opacity: 1,
    warpIntensity: 1.0,
    blurPasses: 12,
    animationSpeed: 2,
    transitionDuration: 0,
    saturation: 1,
    tintColor: [0,0,0] as RgbColor,
    tintIntensity: 0,
    dithering: 0.008,
    scale: 2,
};

/**
 * Home page — contains all the main sections of the site.
 * Right now it has the Hero Header and the Favourites section.
 */
function Home() {
    const { content, loading, error } = useSiteContent();
    const home = content?.home;
    const { ref: kawarpRef, loadBlob, loadGradient, start } = useKawarp();
    const { src: kawarpSourceOption, opacity, tintColor, ...kawarpOptionsWithoutTint } = KAWARP_OPTIONS;
    const kawarpOptions = {
        ...kawarpOptionsWithoutTint,
        tintColor: toKawarpRgb(tintColor),
    };
    const kawarpSource = kawarpSourceOption || home?.avatarUrl;

    useEffect(() => {
        let cancelled = false;

        // Start with a local source, then replace it with the blob-backed image
        // once the remote URL has been fetched.
        loadGradient(["#303446", "#1e2030", "#414559", "#242638"], 135);
        start();

        if (!kawarpSource) {
            return () => {
                cancelled = true;
            };
        }

        void fetch(kawarpSource)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch Kawarp source: ${response.status}`);
                }
                return response.blob();
            })
            .then((blob) => {
                if (!cancelled) {
                    return loadBlob(blob);
                }
                return undefined;
            })
            .catch((sourceError) => {
                console.error("Could not load Kawarp source blob", sourceError);
            });

        return () => {
            cancelled = true;
        };
    }, [kawarpSource, loadBlob, loadGradient, start]);

    return (
        <main className="home-page">
            <Kawarp
                ref={kawarpRef}
                className="home-page__kawarp"
                style={{ position: "fixed", inset: 0, width: "100%", height: "100vh", opacity }}
                autoPlay={false}
                aria-hidden="true"
                {...kawarpOptions}
            />

            <div className="home-page__content">
                {/* ── Hero Header ── */}
                <section className="hero-header__root">
                    {/* Profile picture */}
                    <div className="hero-header__img-wrapper">
                        {home?.avatarUrl && (
                            <img className="hero-header__img" src={home.avatarUrl} alt={home.avatarAlt} />
                        )}
                    </div>

                    {/* Title & subtitle */}
                    <div className="hero-header__content">
                        <h1 className="hero-header__title">{home?.title ?? (loading ? "loading…" : "")}</h1>
                        <p className="hero-header__subtitle">{home?.subtitle ?? ""}</p>
                        <p className="hero-header__subsubtitle">{home?.subsubtitle ?? error ?? ""}</p>
                        <hr className="hero-header__divider" />
                    </div>

                    {/* Scroll-down hint */}
                    <div className="hero-header__scroll-hint">
                        <span className="hero-header__scroll-arrow" />
                    </div>
                </section>

                {/* ── Favourites Section ── */}
                <Favourites />
            </div>
        </main>
    );
}

export default Home;
