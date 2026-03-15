import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Games.css";

/* ─────────────────────────────────────────────────────────
 * Static config — stuff that doesn't come from the API.
 * The images are from Steam's CDN and the titles are just
 * labels, so we hard-code them here.
 * ───────────────────────────────────────────────────────── */

const STEAM_ID = "76561199002412925";

const GAME_CONFIG = [
    { appId: 1384160, title: "Guilty Gear -STRIVE-", description: "people say it's for casuals... i lowkey agree..... BUT IT'S FUN!!! i am not going to pretend like learning 182 different gatlings per character on GGXrd or GGACPR is fun at all. because it's not. universalized gatlings is beautiful, the characters i play are fun enough and isn't wholly gutted so that's why i put up with it. first fighting game i ever played and still the most fun i ever had. genuine 10/10. absolute sweep." },
    { appId: 1030300, title: "Hollow Knight: Silksong", description: "I HATE YOU TEAM CHERRY FOR MAKING ME LOVE THIS GAME!!!!!!!!!! it's hard yes (and genuine RAGEBAIT btw) but the movement is sooooo fun sometimes you almost forgot you had to walk back like 3 hours just to refight a boss. it's one of those games you remember being so fun but when you actually play it all you feel is dread, pain, and suffering. still fun tho <3" },
    { appId: 391540, title: "UNDERTALE", description: "this game pretty much shaped my childhood (and a lot of other people too). opened my worldview and made me like, woke or something. probably the first time i ever felt any emotion on a video game. (i swear i played more than 3 minutes i pirated it when i was a kid :D)" },
    { appId: 526870, title: "Satisfactory", description: "yet another casual game. you play this game, look at the clock, see it's 5, keep looking at the screen, then look at the clock again. still points to 5, but the sun is rising again for some reason." },
    { appId: 367520, title: "Hollow Knight", description: "just cause the second game is number 2 don't mean i can't put the first one here LMAOOOOO like okay, the first one is still a really, really, really, really, really, really, really, really, REALLY good game on its own. it's fun mechanically, it's fun story wise, what can i say team cherry cooks i guess :D" },
    { appId: 504230, title: "Celeste", description: "the one word to describe the game is probably 'movementslop', like the sole reason it's so fun is because you zip around everywhere in lightning speed and it's just so fun doing that sometimes" },
    { appId: 105600, title: "Terraria", description: "fun with friends, fun alone (sometimes), fun pretty much any time. devs are sweethearts too i can't lie. modding is also like, HUGE in this game. you'll never get bored. one of the best time sinks i've ever bought" },
    { appId: 1778820, title: "TEKKEN 8", description: "WHY IS THIS HERE I HATE THIS GAME WHY DO I KEEP PLAYING IT??????? ragebait game 5/10 at best" },
    { appId: 275850, title: "No Man's Sky", description: "if i was creative and willing to put the time (and have friends to play this with) i would have like a trillion hours. one of its shortcomings is unfortunately that there's really so much to do but you don't really know why you should do them." },
    { appId: 548430, title: "Deep Rock Galactic", description: "usually i hate shooters. this one is the exception. i'm still ass at aiming and allat but like, i can't deny the dumb fun of just shooting bugs and mining ores. has the same problem with no man's sky though, it gets boring without friends" },
];

const APP_IDS_CSV = GAME_CONFIG.map((g) => g.appId).join(",");

/* ─────────────────────────────────────────────────────────
 * Types for the API responses
 * ───────────────────────────────────────────────────────── */

interface FastData {
    totalPlaytime: number | null;       // total minutes across ALL owned games
    gamePlaytimes: Record<string, number> | null;  // minutes per requested game
}

interface ProfileItems {
    profile_background: string | null;
    mini_profile_background: string | null;
    avatar_frame: string | null;
    animated_avatar: string | null;
    profile_modifier: string | null;
    steam_deck_keyboard_skin: string | null;
}

interface HeavyData {
    profile: {
        personaname: string;
        avatarfull: string;
        timecreated: number;
        timeSinceCreation: string;
    } | null;
    achievements: Record<string, number | null>;
    prices: Record<string, { initial: number; final: number; discount_percent: number } | null> | null;
    profileItems: ProfileItems | null;
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

    const [fastData, setFastData] = useState<FastData | null>(null);
    const [heavyData, setHeavyData] = useState<HeavyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, _setError] = useState<string | null>(null);

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    // Fetch both endpoints on mount
    useEffect(() => {
        const fetchFast = fetch(`/.netlify/functions/steam-fast/${STEAM_ID}/${APP_IDS_CSV}`)
            .then((res) => res.json())
            .then((data: FastData) => setFastData(data))
            .catch(() => null);

        const fetchHeavy = fetch(`/.netlify/functions/steam-heavy/${STEAM_ID}/${APP_IDS_CSV}`)
            .then((res) => res.json())
            .then((data: HeavyData) => setHeavyData(data))
            .catch(() => null);

        Promise.all([fetchFast, fetchHeavy]).finally(() => setLoading(false));
    }, []);

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
    const profileBackgroundUrl = profileItems?.profile_background ?? null;
    const miniProfileBackgroundUrl = profileItems?.mini_profile_background ?? null;
    const avatarFrameUrl = profileItems?.avatar_frame ?? null;
    /* ── Build game list ── */
    const games = GAME_CONFIG.map((cfg) => {
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

    if (error) {
        return (
            <main className="games-page">
                <Link to="/" className="games-page__back">
                    <span className="games-page__back-arrow">←</span>
                    back home
                </Link>
                <div className="games-page__error">
                    <h2>something went wrong</h2>
                    <p>{error}</p>
                </div>
            </main>
        );
    }

    const statBox = (
        <div className="games-hero__stat-box">
            <div className="games-hero__stat">
                <span className="games-hero__stat-label">Member Since:</span>
                <span className="games-hero__stat-value">{memberSince}</span>
            </div>
            <div className="games-hero__stat">
                <span className="games-hero__stat-label">Hours on Record:</span>
                <span className="games-hero__stat-value">
                    {loading ? "…" : totalHours.toLocaleString()}
                </span>
            </div>
            <div className="games-hero__stat">
                <span className="games-hero__stat-label">Hours %:</span>
                <span className="games-hero__stat-value">
                    {loading ? "…" : `${hoursPercentage}%`}
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
                    <h1 className="games-page__title">games</h1>
                    <p className="games-page__subtitle">top 10 games of the history of mankind (objectively correct)</p>
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
                        {loading
                            ? GAME_CONFIG.map((_, i) => <GameBoxSkeleton key={i} rank={i + 1} />)
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
