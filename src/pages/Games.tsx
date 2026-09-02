import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Games.css";
import { useSiteContent } from "../lib/use-site-content.ts";
// Placeholder background — only exists locally (.assets is gitignored).
// import.meta.glob silently returns {} when the file is missing, so
// production builds won't crash.
const _placeholderMods = import.meta.glob(
    "../../.assets/phosphophyllite-houseki-no-kuni.1920x1080.webm",
    { eager: true, import: "default" },
) as Record<string, string>;
const placeholderBg: string | null = Object.values(_placeholderMods)[0] ?? null;

/* ─────────────────────────────────────────────────────────
 * Types for the API responses
 * ───────────────────────────────────────────────────────── */

interface FastData {
    totalPlaytime: number | null;       // total minutes across ALL owned games
    gamePlaytimes: Record<string, number> | null;  // minutes per requested game
}

/* ─────────────────────────────────────────────────────────
 * Helper: format price in IDR
 * ───────────────────────────────────────────────────────── */

function formatIDR(amount: number): string {
    return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatPrice(priceData: { initial: number; final: number; discount_percent: number } | null | undefined): string {
    if (!priceData) return "Free to Play";
    if (priceData.final === 0 && priceData.initial === 0) return "Free to Play";
    return formatIDR(priceData.final);
}

/* ─────────────────────────────────────────────────────────
 * Helper: calculate hours percentage
 * ───────────────────────────────────────────────────────── */

function calculateHoursPercentage(totalMinutes: number, timecreated: number): string {
    const creationDate = new Date(timecreated * 1000);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - creationDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation <= 0) return "0";
    const totalHours = totalMinutes / 60;
    return ((totalHours / hoursSinceCreation) * 100).toFixed(2);
}

/* ─────────────────────────────────────────────────────────
 * Helper: Media Background for WebM and Images
 * ───────────────────────────────────────────────────────── */

function MediaBackground({ url, className }: { url: string | null; className: string }) {
    if (!url) return null;
    const cleanUrl = url.split("?")[0];
    const isVideo = cleanUrl.endsWith(".webm") || cleanUrl.endsWith(".mp4");
    if (isVideo) {
        return (
            <video className={className} autoPlay muted loop playsInline>
                <source src={url} type="video/webm" />
            </video>
        );
    }
    return <div className={className} style={{ backgroundImage: `url(${url})` }} />;
}

/* ─────────────────────────────────────────────────────────
 * GameBox component (unchanged visually)
 * ───────────────────────────────────────────────────────── */

function GameBox({ rank, title, description, playtime, achievementPct, price, appId, }: {
    rank: number;
    title: string;
    description: string;
    playtime: string;
    achievementPct: string;
    price: string;
    appId: number;
}) {
    return (
        <div className="game-box">
            <div className="game-box__header">
                <span className="game-box__rank">#{rank}</span>
                <div className="game-box__titles">
                    <span className="game-box__title">{title}</span>
                </div>
            </div>
            {description && <p className="game-box__description">{description}</p>}

            <div className="game-box__content">
                <div className="game-box__image-wrapper">
                    <img className="game-box__image" src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`} alt={title} />
                </div>

                <div className="game-box__stats">
                    <div className="game-stat">
                        <span className="game-stat__label">Playtime:</span>
                        <span className="game-stat__value">{playtime}</span>
                    </div>
                    <div className="game-stat">
                        <span className="game-stat__label">Achievements:</span>
                        <span className="game-stat__value">{achievementPct}</span>
                    </div>
                </div>
            </div>

            <div className="game-box__footer">
                <div className="game-box__price">{price}</div>
                <a
                    href={`https://store.steampowered.com/app/${appId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="game-box__store-btn"
                >
                    Store Page
                </a>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────
 * Loading skeleton for a game card
 * ───────────────────────────────────────────────────────── */

function GameBoxSkeleton({ rank }: { rank: number }) {
    return (
        <div className="game-box game-box--skeleton">
            <div className="game-box__header">
                <span className="game-box__rank">#{rank}</span>
                <div className="game-box__titles">
                    <span className="skeleton-line" style={{ width: "60%" }} />
                </div>
            </div>
            <div className="game-box__content">
                <div className="game-box__image-wrapper skeleton-shimmer" />
                <div className="game-box__stats">
                    <div className="game-stat"><span className="skeleton-line" /><span className="skeleton-line" style={{ width: "30%" }} /></div>
                    <div className="game-stat"><span className="skeleton-line" /><span className="skeleton-line" style={{ width: "30%" }} /></div>
                </div>
            </div>
            <div className="game-box__footer">
                <span className="skeleton-line" style={{ width: "4rem" }} />
                <span className="skeleton-line" style={{ width: "5rem" }} />
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────
 * Main page component
 * ───────────────────────────────────────────────────────── */

function Games() {
    const { pathname } = useLocation();
    const { content, loading: contentLoading, error: contentError } = useSiteContent();

    const [fastData, setFastData] = useState<FastData | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    // Fetch the frequently-changing playtime data on mount.
    // The slow profile/achievement/price snapshot is included in the content blob.
    useEffect(() => {
        if (!content) return;

        const appIdsCsv = content.games.items.map((game) => game.appId).join(",");
        const fetchFast = fetch(`/.netlify/functions/steam-fast/${content.games.steamId}/${appIdsCsv}`)
            .then((res) => res.json())
            .then((data: FastData) => setFastData(data))
            .catch(() => null);

        fetchFast.finally(() => setDataLoading(false));
    }, [content]);

    if (!content) {
        return (
            <main className="games-page">
                <Link to="/" className="games-page__back">← back home</Link>
                <div className="games-page__error">
                    <h2>{contentLoading ? "loading…" : "something went wrong"}</h2>
                    {!contentLoading && <p>{contentError}</p>}
                </div>
            </main>
        );
    }

    const gameConfig = content.games.items;
    const heavyData = content.steam;

    /* ── Derived profile values ── */
    const profile = heavyData?.profile;
    const profileItems = heavyData?.profileItems;
    const displayName = profile?.personaname ?? "Loading…";
    const avatarUrl = profile?.avatarfull ?? "";
    const memberSince = profile?.timecreated
        ? new Date(profile.timecreated * 1000).getFullYear()
        : "—";
    const totalMinutes = fastData?.totalPlaytime ?? 0;
    const totalHours = Math.round(totalMinutes / 60);
    const hoursPercentage = profile?.timecreated
        ? calculateHoursPercentage(totalMinutes, profile.timecreated)
        : "—";
    const profileBackgroundUrl = profileItems?.profile_background ?? placeholderBg;
    const miniProfileBackgroundUrl = profileItems?.mini_profile_background ?? null;
    const avatarFrameUrl = profileItems?.avatar_frame ?? null;
    /* ── Build game list ── */
    const games = gameConfig.map((cfg) => {
        const id = String(cfg.appId);
        const playtimeMinutes = fastData?.gamePlaytimes?.[id] ?? null;
        const achievePct = heavyData?.achievements?.[id] ?? null;
        const priceEntry = heavyData?.prices?.[id];

        return {
            ...cfg,
            playtime: playtimeMinutes != null
                ? `${Math.round(playtimeMinutes / 60).toLocaleString()} hrs`
                : "N/A",
            achievementPct: achievePct != null ? `${achievePct}%` : "N/A",
            price: formatPrice(priceEntry),
        };
    });

    const statBox = (
        <div className="games-hero__stat-box">
            <div className="games-hero__stat">
                <span className="games-hero__stat-label">Member Since:</span>
                <span className="games-hero__stat-value">{memberSince}</span>
            </div>
            <div className="games-hero__stat">
                <span className="games-hero__stat-label">Hours on Record:</span>
                <span className="games-hero__stat-value">
                    {contentLoading || dataLoading ? "…" : totalHours.toLocaleString()}
                </span>
            </div>
            <div className="games-hero__stat">
                <span className="games-hero__stat-label">Hours %:</span>
                <span className="games-hero__stat-value">
                    {contentLoading || dataLoading ? "…" : `${hoursPercentage}%`}
                </span>
                <span className="games-hero__stat-desc">(time spent since est.)</span>
            </div>
        </div>
    );

    return (
        <>
            <MediaBackground url={profileBackgroundUrl} className="games-page__bg-media" />
            <main className="games-page">

                <Link to="/" className="games-page__back">
                    <span className="games-page__back-arrow">←</span>
                    back home
                </Link>

                <div className="games-page__header">
                    <h1 className="games-page__title">{content.games.title}</h1>
                    <p className="games-page__subtitle">{content.games.subtitle}</p>
                    <hr className="games-page__divider" />
                </div>

                {/* Profile Hero Section */}
                <section className="games-hero">
                    <MediaBackground url={miniProfileBackgroundUrl} className="games-hero__bg-media" />
                    <div className="games-hero__content">
                        <div className="games-hero__avatar-container">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="games-hero__avatar" />
                            ) : (
                                <div className="games-hero__avatar skeleton-shimmer" />
                            )}
                            {avatarFrameUrl && (
                                <MediaBackground url={avatarFrameUrl} className="games-hero__avatar-frame" />
                            )}
                        </div>
                        <div className="games-hero__info">
                            <h2 className="games-hero__name">{displayName}</h2>
                            <div className="games-hero__details games-hero__details--desktop">
                                {statBox}
                            </div>
                        </div>
                    </div>
                </section>
                <section className="games-hero__details--mobile">
                    {statBox}
                </section>

                {/* Games List */}
                <section className="games-page__section" id="list">
                    <div className="games-page__boxes">
                        {dataLoading
                            ? gameConfig.map((_, i) => <GameBoxSkeleton key={i} rank={i + 1} />)
                            : games.map((item, i) => (
                                <GameBox key={i} rank={i + 1} {...item} />
                            ))
                        }
                    </div>
                </section>
            </main>
        </>
    );
}

export default Games;
