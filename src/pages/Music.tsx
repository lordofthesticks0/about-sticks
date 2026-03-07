import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

/*
 * Music subpage — /music
 *
 * Three sections: Best Tracks, Best Albums, Best Artists.
 * Each has 5 boxes with a rank, title, artist, description, and embed.
 *
 * For the `link` field, just paste a normal Apple Music share link like:
 *   https://music.apple.com/us/song/anklebiters/593148442
 * The code auto-converts it to an embed URL.
*/

/**
 * Converts a regular Apple Music share link into an embed URL.
 *
 * Input:  "https://music.apple.com/us/song/anklebiters/593148442"
 * Output: "https://embed.music.apple.com/us/song/anklebiters/593148442?theme=dark"
 */
function toEmbedUrl(shareLink: string): string {
    if (!shareLink) return "";
    return shareLink.replace("https://", "https://embed.") + "?theme=dark";
}

const TRACKS = [
    {
        title: "Anklebiters",
        artist: "Paramore",
        description: "I LOVE PARAMORE!!!! ok so this song in particular really hits me. i've been having problems with myself and this song really does let me '...fall in love with myself' as it said. GOD i love paramore.",
        link: "https://music.apple.com/us/song/anklebiters/593148442",
    },
    {
        title: "I Love You, I'm Sorry",
        artist: "Gracie Abrams",
        description: "oh woooow a love song that's crazyyy... but like for real, i kinda want to say this to someone tbh, but it is what it is sometimes isn't it? anyways, Gracie Abrams herself really have a phenomenal voice for her performance. all in all it's a damn good song.",
        link: "https://music.apple.com/us/song/i-love-you-im-sorry/1773474469",
    },
    {
        title: "The Reckless and The Brave",
        artist: "All Time Low",
        description: "i mean it sounds really good can you blame me? it's just dumb fun, ATL cooked hard on the guitar and the tunes, overanalyzing the lyrics is just too much. no avant garde bullshit, it just sounds good.",
        link: "https://music.apple.com/us/song/the-reckless-and-the-brave/687527846",
    },
    {
        title: "ballad of a homeschooled girl",
        artist: "Olivia Rodrigo",
        description: "unfortunately it kinda describes my social life... OR AT LEAST IT ALMOST DID. i'm glad that i have friends who can power me through that phase, but pleeaseee if you relate to this song talk to your friends <3",
        link: "https://music.apple.com/us/song/ballad-of-a-homeschooled-girl/1736995395",
    },
    {
        title: "あの夢をなぞって",
        artist: "YOASOBI",
        description: "literally means 'Tracing That Dream', i really like the sound of the the absolutely phenomenal guitar they added here. all time classic. and the lyrics actually gives me goosebumps maaaannnn i want to shoot my shot and just confess at times :((",
        link: "https://music.apple.com/us/song/ano-yume-wo-nazotte/1542182544",
    },
];

const ALBUMS = [
    {
        title: "After Laughter",
        artist: "Paramore",
        description: "this album kinda signifies how paramore changed from an emo punk band to something a little more pop. they were experimenting with this and it actually worked. it's actually so good to listen to and in general a vibe. even the songs hit too, they mostly talk about dealing with ageing and just depression. phenomenal album by the genuine GOAT.",
        link: "https://music.apple.com/us/album/after-laughter/1227049864",
    },
    {
        title: "GUTS (spilled)",
        artist: "Olivia Rodrigo",
        description: "mostly talks about how she herself grew up and the difficulties she face. even though i don't really relate too much, but the album itself is an experiment, it's not just 'pure' pop like her previous album, but this one actually have rock elements inside. i really like it, she's leaning to something like Avril Lavigne and she lowkey cooked.",
        link: "https://music.apple.com/us/album/guts-spilled/1736994915",
    },
    {
        title: "What is Love? (Deluxe)",
        artist: "Clean Bandit",
        description: "this one is rather old, though still the whole album has nothing but bangers. genuinely fun to listen to. it's like a song you can dance to but the lyrics are somewhat bittersweet and it somehow just works. really love it.",
        link: "https://music.apple.com/us/album/what-is-love-deluxe/1436738680",
    },
    {
        title: "From Zero (Deluxe Edition)",
        artist: "Linkin Park",
        description: "i can't lie man, it just sounds good and really makes you wanna wake up and do things. i mean linkin park was entirely different before this album, it's almost like they changed everyone to someone else. something something The Ship of Theseus. still really good though.",
        link: "https://music.apple.com/us/album/from-zero-deluxe-edition/1801842323",
    },
    {
        title: "Short n Sweet (Deluxe)",
        artist: "Sabrina Carpenter",
        description: "i'm no girl but i think i can appreciate her transformation and honesty. she practically became independent and free herself from her old disney princess shit that didn't really took off, so she instead punches bad exes in the gut and the music industry too while at it. also it's a vibe.",
        link: "https://music.apple.com/us/album/short-n-sweet-deluxe/1795512297",
    },
];

const ARTISTS = [
    {
        title: "Paramore",
        description: "i love paramore i love paramore i love paramore I LOVEE PARAMOREEEEE!!! their songs are so fun to listen to, it's always upbeat, but there's always some meaning you can extract that's also fun to extract. they have a really wide range from punk, mellow pop, and the latest one is straight up alt pop. i REALLY love them.",
        image: "https://www.nme.com/wp-content/uploads/2023/02/NME-PARAMORE-2023-2-credit-Zachary-Gray@2160x2700.jpg",
    },
    {
        title: "Ado",
        description: "all she does is sing and she does it really good!!!!! she only recently revealed her face so she was literally faceless for like the entirety of her career. starts from uploading her covering songs and now making her own ones really really quickly. she also has like a huge range, both vocal and discography wise.",
        image: "https://static.wikia.nocookie.net/nicodougasingers/images/b/b8/2025.01_%281_-_v1%29.jpg",
    },
    {
        title: "Avenged Sevenfold",
        description: "had a lot of history with them, and putting them anywhere below my 3rd favourite artist would be a major disrespect. i'd be listening to boring whatever's popular pop without them. their songs are just so fun and lifts your own spirit to a mile high.",
        image: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Avenged_Sevenfold_2.jpg",
    },
    {
        title: "DECO *27",
        description: "genuinely the greatest vocaloid artists out there. made it big and keeps on delivering. albeit there might be some misses some time, there's still a lot more hits to like. mostly talks about... idk really whatever it is his songs talks about. still like him though.",
        image: "https://static.wikia.nocookie.net/project-diva/images/8/82/DECO27.png",
    },
    {
        title: "Chappel Roan",
        description: "she has like, a really really good voice, and although i can't really relate to her songs i can tell she's having fun and damnit that's all i need. the songs she sings are also just plain dumb fun and it sounds like she's singing with a fat smile on her own face.",
        image: "https://upload.wikimedia.org/wikipedia/commons/8/84/ChappellRoanRockES200825-198_%28cropped%29.jpg",
    },
];

/**
 * ArtistBox — like MusicBox but shows an image instead of an iframe.
 * Just paste an image URL into the `image` field.
 */
function ArtistBox({ rank, title, description, image }: {
    rank: number;
    title: string;
    description: string;
    image: string;
}) {
    return (
        <div className="music-box">
            <div className="music-box__header">
                <span className="music-box__rank">#{rank}</span>
                <div className="music-box__titles">
                    <span className="music-box__title">{title}</span>
                </div>
            </div>
            {description && <p className="music-box__description">{description}</p>}
            {image ? (
                <div className="music-box__image-wrapper">
                    <div className="music-box__image-gradient" />
                    <img
                        className="music-box__image"
                        src={image}
                        alt={title}
                    />
                </div>
            ) : (
                <div className="music-box__embed-placeholder">
                    image coming soon!
                </div>
            )}
        </div>
    );
}

/**
 * A single "music box" — shows rank, title + artist, description,
 * and an Apple Music embed (auto-converted from a share link).
 */
function MusicBox({ rank, title, artist, description, link, embedHeight = 175 }: {
    rank: number;
    title: string;
    artist: string;
    description: string;
    link: string;
    embedHeight?: number;
}) {
    const embedUrl = toEmbedUrl(link);
    const [loaded, setLoaded] = useState(false);

    return (
        <div className="music-box">
            <div className="music-box__header">
                <span className="music-box__rank">#{rank}</span>
                <div className="music-box__titles">
                    <span className="music-box__title">{title}</span>
                    {artist && <span className="music-box__artist">{artist}</span>}
                </div>
            </div>
            <p className="music-box__description">{description}</p>
            {embedUrl ? (
                <div className="music-box__embed-wrapper" style={{ height: embedHeight }}>
                    {/* Loading placeholder — visible until iframe fires onLoad */}
                    {!loaded && (
                        <div className="music-box__loading">
                            <span className="music-box__loading-text">loading...</span>
                        </div>
                    )}
                    <iframe
                        className={`music-box__embed ${loaded ? "music-box__embed--loaded" : ""}`}
                        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                        frameBorder="0"
                        height={embedHeight}
                        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                        src={embedUrl}
                        onLoad={() => setLoaded(true)}
                    />
                </div>
            ) : (
                <div className="music-box__embed-placeholder">
                    embed coming soon!
                </div>
            )}
        </div>
    );
}

function Music() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (hash) {
            if (hash === '#tracks') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const el = document.getElementById(hash.substring(1));
                if (el) {
                    // slight delay to let the page render first
                    setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
                }
            }
        } else {
            window.scrollTo(0, 0);
        }
    }, [pathname, hash]);

    return (
        <main className="music-page">
            {/* Back button */}
            <Link to="/" className="music-page__back">
                <span className="music-page__back-arrow">←</span>
                back home
            </Link>

            {/* Page header */}
            <div className="music-page__header">
                <h1 className="music-page__title">music</h1>
                <p className="music-page__subtitle">
                    lol i had to change the colours because apple music embeds can't be assed
                </p>
                <p className="music-page__warning">
                    warning: the embeds are <strong>LOUD</strong>, i can't change their volumes.
                </p>
                <hr className="music-page__divider" />
            </div>

            {/* Jump-links nav */}
            <nav className="music-page__nav">
                <a href="#tracks" className="music-page__nav-link">tracks</a>
                <span className="music-page__nav-dot">·</span>
                <a href="#albums" className="music-page__nav-link">albums</a>
                <span className="music-page__nav-dot">·</span>
                <a href="#artists" className="music-page__nav-link">artists</a>
            </nav>

            {/* ── Best Tracks ── */}
            <section className="music-page__section" id="tracks">
                <h2 className="music-page__section-title">tracks</h2>
                <div className="music-page__boxes">
                    {TRACKS.map((item, i) => (
                        <MusicBox key={i} rank={i + 1} embedHeight={175} {...item} />
                    ))}
                </div>
            </section>

            {/* ── Best Albums ── */}
            <section className="music-page__section" id="albums">
                <h2 className="music-page__section-title">albums</h2>
                <div className="music-page__boxes">
                    {ALBUMS.map((item, i) => (
                        <MusicBox key={i} rank={i + 1} embedHeight={450} {...item} />
                    ))}
                </div>
            </section>

            {/* ── Best Artists ── */}
            <section className="music-page__section" id="artists">
                <h2 className="music-page__section-title">artists</h2>
                <div className="music-page__boxes">
                    {ARTISTS.map((item, i) => (
                        <ArtistBox key={i} rank={i + 1} {...item} />
                    ))}
                </div>
            </section>
        </main>
    );
}

export default Music;
