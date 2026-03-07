import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Music from "./pages/Music";
import Footer from "./components/Footer";
import ConstructionBanner from "./components/ConstructionBanner";

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
      </Routes>
      <ConstructionBanner />
      <Footer />
    </>
  );
}

export default App;
