import { useEffect, useState } from "react";
import { useHcs } from "../hooks/useHcs";
import type { HcsMessage } from "../hooks/useHcs";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS: Record<string, string> = {
  CREATED: "yellow",
  IN_TRANSIT: "orange",
  RECEIVED: "green",
  TRANSFUSED: "green",
  EXPIRED: "red",
  DISCARDED: "red",
};

export default function Mosaic() {
  const { fetchRecent } = useHcs();
  const [bags, setBags] = useState<HcsMessage[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const msgs = await fetchRecent(100); // fetch last 100 events
      // deduplicate → keep latest status per bag
      const latest: Record<string, HcsMessage> = {};
      for (const m of msgs) {
        if (!latest[m.bagId] || m.ts > latest[m.bagId].ts) {
          latest[m.bagId] = m;
        }
      }
      setBags(Object.values(latest));
    };
    load();
  }, [fetchRecent]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Blood Bag Mosaic</h1>
      <p>Each square = 1 blood bag. Click to verify.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 20px)",
          gap: 4,
          marginTop: 20,
        }}
      >
        {bags.map((b, idx) => (
          <div
            key={idx}
            onClick={() => navigate(`/verify?bagId=${b.bagId}`)}
            title={`${b.bagId} – ${b.status}`}
            style={{
              width: 20,
              height: 20,
              backgroundColor: STATUS_COLORS[b.status] || "gray",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}
