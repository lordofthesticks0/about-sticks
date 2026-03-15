import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home.tsx";
import Music from "./pages/Music.tsx";
import Games from "./pages/Games.tsx";
import Movies from "./pages/Movies.tsx";
import Anime from "./pages/Anime.tsx";
import Footer from "./components/Footer.tsx";
import ConstructionBanner from "./components/ConstructionBanner.tsx";

/**
 * App — the root layout component.
 *
 * It defines the routes for the site:
 *   /       → Home page (hero header + sections)
 *   /music  → Music subpage
 */
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/music" element={<Music />} />
        <Route path="/games" element={<Games />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/anime" element={<Anime />} />
      </Routes>
      <ConstructionBanner />
      <Footer />
    </>
  );
}

export default App;
