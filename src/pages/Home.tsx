import MusicSection from "../components/MusicSection";

/**
 * Home page — contains all the main sections of the site.
 * Right now it has the Hero Header and the Music section.
 */
function Home() {
    return (
        <>
            {/* ── Hero Header ── */}
            <section className="hero-header__root">
                {/* Profile picture */}
                <div className="hero-header__img-wrapper">
                    <img
                        className="hero-header__img"
                        src="https://cdn.discordapp.com/avatars/546229347703586839/2dc08467c2eee98f79a3fa2e22940fc2.png?size=256"
                        alt="me!!! (not really)"
                    />
                </div>

                {/* Title & subtitle */}
                <div className="hero-header__content">
                    <h1 className="hero-header__title">hey there </h1>
                    <p className="hero-header__subtitle">welcome to my site!!</p>
                    <p className="hero-header__subsubtitle">this was only like 10% vibecoded i swear the purple is catppuccin</p>
                    <hr className="hero-header__divider" />
                </div>

                {/* Scroll-down hint */}
                <div className="hero-header__scroll-hint">
                    <span className="hero-header__scroll-arrow" />
                </div>
            </section>

            {/* ── Music Section ── */}
            <MusicSection />
        </>
    );
}

export default Home;
