import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHcs } from "../hooks/useHcs";
import type { HcsMessage } from "../hooks/useHcs";
import { NAV_HEIGHT, NAV_OFFSET } from "../App";

// calm, hope-oriented palette
const STATUS_COLORS: Record<string, string> = {
  CREATED:   "#F4C152",
  IN_TRANSIT:"#7BAAF7",
  RECEIVED:  "#4CC38A",
  TRANSFUSED:"#B48CF2",
  EXPIRED:   "#F56B6B",
  DISCARDED: "#A8A8B3",
};

// fixed map dims
const ROWS = 16;
const COLS = 32;
const GAP  = 2;          // px
const TILE_MAX = 26;
const TILE_MIN = 10;

export default function Home() {
  const { fetchRecent } = useHcs();
  const [bags, setBags] = useState<HcsMessage[]>([]);
  const [tile, setTile] = useState<number>(18);

  const headerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const helpRef   = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const msgs = await fetchRecent(ROWS * COLS);
      const seen: Record<string, boolean> = {};
      const unique = msgs.filter((m) => {
        if (seen[m.bagId]) return false;
        seen[m.bagId] = true;
        return true;
      });
      setBags(unique);
    })();
  }, [fetchRecent]);

  // compute tile so the whole thing fits *exactly* above the floating navbar
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const headerH = headerRef.current?.offsetHeight ?? 0;
      const legendH = legendRef.current?.offsetHeight ?? 0;
      const helpH   = helpRef.current?.offsetHeight ?? 0;

      // tighter top spacing as requested
      const topMargins = 8;      // trims the top area
      const sidePad    = 32;     // left/right breathing
      const bottomReserve = NAV_HEIGHT + NAV_OFFSET + 8;

      const availW = Math.max(0, vw - sidePad * 2);
      const availH = Math.max(0, vh - (headerH + legendH + helpH + topMargins) - bottomReserve);

      const perTileW = Math.floor((availW - (COLS - 1) * GAP - 12) / COLS);
      const perTileH = Math.floor((availH - (ROWS - 1) * GAP - 12) / ROWS);

      const size = Math.max(TILE_MIN, Math.min(TILE_MAX, Math.min(perTileW, perTileH)));
      setTile(size);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of bags) c[b.status] = (c[b.status] || 0) + 1;
    return c;
  }, [bags]);

  const panelW = COLS * tile + (COLS - 1) * GAP + 12;
  const panelH = ROWS * tile + (ROWS - 1) * GAP + 12;

  return (
    <div
      style={{
        height: `calc(100vh)`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "6px 16px 0", // trimmed top as requested
      }}
    >
      {/* Header */}
      <div ref={headerRef} style={{ width: "100%", maxWidth: 1100, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: 26, letterSpacing: 0.2, color: "#0B1020" }}>
            PixelAfrica
          </h1>
          <span style={{ color: "#5F6B7A", fontSize: 13 }}>
            A clear, honest view of where blood is.
          </span>
        </div>
        <p style={{ marginTop: 4, color: "#6B7280", fontSize: 13, maxWidth: 760 }}>
          Each square is a bag. The color tells you what’s happening now. Click a pixel to see its trail, end to end.
        </p>
      </div>

      {/* Legend */}
      <div
        ref={legendRef}
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          margin: "2px 0 6px",
        }}
      >
        {Object.entries(STATUS_COLORS).map(([k, color]) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, background: color, boxShadow: "0 0 0 1px rgba(0,0,0,0.06) inset" }} />
            <span style={{ fontSize: 12, color: "#374151" }}>{k}</span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{counts[k] || 0}</span>
          </span>
        ))}
      </div>

      {/* Pixel Map */}
      <div
        style={{
          width: panelW,
          height: panelH,
          padding: 6,
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 10px 30px rgba(31,42,55,0.08)",
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: panelW - 12,
            height: panelH - 12,
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, ${tile}px)`,
            gridAutoRows: `${tile}px`,
            gap: GAP,
            imageRendering: "pixelated",
            background:
              "repeating-linear-gradient(0deg, rgba(31,42,55,0.035) 0 1px, transparent 1px 22px), " +
              "repeating-linear-gradient(90deg, rgba(31,42,55,0.035) 0 1px, transparent 1px 22px)",
          }}
        >
          {bags.slice(0, ROWS * COLS).map((b) => {
            const color = STATUS_COLORS[b.status] || "#D1D5DB";
            return (
              <div
                key={b.bagId}
                title={`Bag ${b.bagId}
Blood: ${b.payload?.bloodType}
Volume: ${b.payload?.volume} ml
Expiry: ${new Date(b.payload?.expiryDate).toLocaleDateString()}
Status: ${b.status}`}
                onClick={() => navigate(`/verify?bagId=${b.bagId}`)}
                style={{
                  width: tile,
                  height: tile,
                  background: color,
                  cursor: "pointer",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.07) inset",
                  transition: "box-shadow 90ms linear",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 0 2px rgba(11,16,32,0.25) inset";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 0 1px rgba(0,0,0,0.07) inset";
                }}
              />
            );
          })}
          {Array.from({ length: Math.max(0, ROWS * COLS - bags.length) }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              style={{
                width: tile,
                height: tile,
                background: "#F3F4F6",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.04) inset",
              }}
            />
          ))}
        </div>
      </div>

      {/* concise how-it-works (trims top spacing, measured in fit calc) */}
      <div
        ref={helpRef}
        style={{
          marginTop: 6,
          fontSize: 12,
          color: "#667085",
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 1100,
        }}
      >
        <span>• Register a bag with its type, volume, and the courier who carries it.</span>
        <span>• Couriers add short location notes while moving the bag.</span>
        <span>• Hospitals close out: received, transfused, expired, or discarded.</span>
      </div>
    </div>
  );
}
