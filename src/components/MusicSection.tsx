import { Link } from "react-router-dom";

/**
 * MusicSection — shown on the home page.
 *
 * Displays three clickable cards that link to anchored sections
 * on the /music subpage: best tracks, best albums, best artists.
 */

const CATEGORIES = [
    { name: "tracks", color: "var(--ctp-pink)", anchor: "#tracks" },
    { name: "albums", color: "var(--ctp-mauve)", anchor: "#albums" },
    { name: "artists", color: "var(--ctp-red)", anchor: "#artists" },
];

function MusicSection() {
    return (
        <section className="music-section" id="music">
            {/* Section heading */}
            <div className="music-section__header">
                <h2 className="music-section__title">music</h2>
                <p className="music-section__subtitle">stuff i listen to</p>
                <hr className="music-section__divider" />
            </div>

            {/* Category cards */}
            <div className="music-section__grid">
                {CATEGORIES.map((cat) => (
                    <Link
                        key={cat.name}
                        to={`/music${cat.anchor}`}
                        className="music-section__card"
                        style={{ "--card-accent": cat.color } as React.CSSProperties}
                    >
                        <span className="music-section__card-name">{cat.name}</span>
                    </Link>
                ))}
            </div>

            {/* "See all" link */}
            <Link to="/music" className="music-section__see-all">
                all →
            </Link>
        </section>
    );
}

export default MusicSection;
