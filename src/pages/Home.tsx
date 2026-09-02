import Favourites from "../components/Favourites.tsx";
import { useSiteContent } from "../lib/use-site-content.ts";

/**
 * Home page — contains all the main sections of the site.
 * Right now it has the Hero Header and the Favourites section.
 */
function Home() {
    const { content, loading, error } = useSiteContent();
    const home = content?.home;

    return (
        <>
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
        </>
    );
}

export default Home;
