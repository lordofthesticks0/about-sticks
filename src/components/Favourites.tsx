import { Link } from "react-router-dom";
import "./Favourites.css";

/**
 * Favourites — shown on the home page.
 *
 * Displays clickable cards that link to different hobby pages.
 */

const CATEGORIES = [
    { name: "Music", color: "#fc3c44", path: "/music" },
    { name: "Games", color: "#171a21", path: "/games" },
    { name: "Movies", color: "#f5c518", path: "/movies" },
    { name: "Anime", color: "#02a9ff", path: "/anime" }
    // { name: "People", color: "#c812adff", path: "" }
    // lol as if i'll ever tell anyone i like may
    // remind me to remove this line in 3 years when i get over her
];

function Favourites() {
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
                {CATEGORIES.map((cat) => (
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
        </section>
    );
}

export default Favourites;
