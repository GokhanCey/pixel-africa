import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Transit from "./pages/Transit";
import Scan from "./pages/Scan";
import Verify from "./pages/Verify";

export const NAV_HEIGHT = 64;
export const NAV_OFFSET = 10; // lift the navbar a bit so the page never scrolls

const linkBase: React.CSSProperties = {
  textDecoration: "none",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  fontSize: 13,
  letterSpacing: 0.6,
  padding: "10px 14px",
  border: "1px solid #D7DBE3",
  background: "#FFFFFF",
  color: "#1F2A37",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 40,
  minWidth: 108,
  boxShadow: "0 0 0 2px #EEF1F6 inset",
  borderRadius: 4,
};

const activeStyle = (color: string): React.CSSProperties => ({
  borderColor: color,
  boxShadow: `0 0 0 2px ${color} inset`,
  color: "#0B1020",
  fontWeight: 700,
});

export default function App() {
  return (
    <Router>
      <div
        style={{
          height: "100vh",
          width: "100%",
          overflow: "hidden", // hard lock: no scroll
          position: "relative",
          background:
            "linear-gradient(180deg, #F9FBFF 0%, #F7FAFD 100%), " +
            "repeating-linear-gradient(0deg, rgba(31,42,55,0.03) 0 1px, transparent 1px 12px), " +
            "repeating-linear-gradient(90deg, rgba(31,42,55,0.03) 0 1px, transparent 1px 12px)",
          color: "#1F2A37",
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        <div style={{ height: "100%", overflow: "hidden" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/transit" element={<Transit />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/verify" element={<Verify />} />
          </Routes>
        </div>

        {/* Floating bottom navbar (raised slightly) */}
        <nav
          style={{
            position: "fixed",
            left: 12,
            right: 12,
            bottom: NAV_OFFSET,
            height: NAV_HEIGHT,
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(0deg, rgba(255,255,255,0.96), rgba(255,255,255,0.96)), " +
              "repeating-linear-gradient(0deg, rgba(31,42,55,0.04) 0 1px, transparent 1px 8px), " +
              "repeating-linear-gradient(90deg, rgba(31,42,55,0.04) 0 1px, transparent 1px 8px)",
            border: "1px solid #E5E7EB",
            boxShadow: "0 12px 28px rgba(17,24,39,0.10), 0 0 0 2px #FFFFFF inset",
            borderRadius: 10,
            zIndex: 50,
            backdropFilter: "saturate(110%) blur(2px)",
          }}
        >
          <NavLink to="/"        style={({ isActive }) => ({ ...linkBase, ...(isActive ? activeStyle("#F4C152") : {}) })}>PIXELAFRICA</NavLink>
          <NavLink to="/register"style={({ isActive }) => ({ ...linkBase, ...(isActive ? activeStyle("#4CC38A") : {}) })}>REGISTER</NavLink>
          <NavLink to="/transit" style={({ isActive }) => ({ ...linkBase, ...(isActive ? activeStyle("#7BAAF7") : {}) })}>TRANSIT</NavLink>
          <NavLink to="/scan"    style={({ isActive }) => ({ ...linkBase, ...(isActive ? activeStyle("#B48CF2") : {}) })}>HOSPITAL</NavLink>
          <NavLink to="/verify"  style={({ isActive }) => ({ ...linkBase, ...(isActive ? activeStyle("#F56B6B") : {}) })}>VERIFY</NavLink>
        </nav>
      </div>
    </Router>
  );
}
