import { Link } from "react-router-dom";
import "./Favourites.css";
import { useSiteContent } from "../lib/use-site-content.ts";

/**
 * Favourites — shown on the home page.
 *
 * Displays clickable cards that link to different hobby pages.
 */

function Favourites() {
    const { content, loading, error } = useSiteContent();

    return (
        <section className="favourites-section" id="favourites">
            {/* Section heading */}
            <div className="favourites-section__header">
                <h2 className="favourites-section__title">favourites</h2>
                <p className="favourites-section__subtitle">stuff i like</p>
                <hr className="favourites-section__divider" />
            </div>

            {/* Category cards */}
            <div className="favourites-section__grid">
                {content?.categories.map((cat) => (
                    <Link
                        key={cat.name}
                        to={cat.path}
                        className="favourites-section__card"
                        style={{ "--card-accent": cat.color } as React.CSSProperties}
                    >
                        <span className="favourites-section__card-name">{cat.name}</span>
                    </Link>
                ))}
            </div>
            {!content && <p>{loading ? "loading…" : error}</p>}
        </section>
    );
}

export default Favourites;
