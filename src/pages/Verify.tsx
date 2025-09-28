import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useHcs } from "../hooks/useHcs";
import type { HcsMessage } from "../hooks/useHcs";

const STATUS_COLORS: Record<string, string> = {
  CREATED:   "#F4C152",
  IN_TRANSIT:"#7BAAF7",
  RECEIVED:  "#4CC38A",
  TRANSFUSED:"#B48CF2",
  EXPIRED:   "#F56B6B",
  DISCARDED: "#A8A8B3",
};

export default function Verify() {
  const { fetchByBag } = useHcs();
  const [bagId, setBagId] = useState("");
  const [history, setHistory] = useState<HcsMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [params] = useSearchParams();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const qId = params.get("bagId");
    if (qId) {
      setBagId(qId);
      handleFetch(qId);
    }
  }, [params]);

  const handleFetch = async (id?: string) => {
    const targetId = id || bagId;
    if (!targetId) return;
    setLoading(true);
    setHasSearched(true);
    const msgs = await fetchByBag(targetId);
    setHistory(msgs);
    setLoading(false);
  };

  const created = history.find((m) => m.status === "CREATED");
  const current = history.length > 0 ? history[0] : null;

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px 16px 0",
      }}
    >
      {/* Header */}
      <div ref={headerRef} style={{ width: "100%", maxWidth: 900, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontWeight: 800, fontSize: 24, color: "#0B1020" }}>
          Verify Blood Bag
        </h1>
        <p style={{ marginTop: 4, fontSize: 13, color: "#6B7280" }}>
          Enter a Bag ID or scan its QR. You’ll see the bag’s public details and lifecycle history.
        </p>
      </div>

      {/* Search */}
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          display: "flex",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <input
          placeholder="Enter Bag ID"
          value={bagId}
          onChange={(e) => setBagId(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #D1D5DB",
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <button
          onClick={() => handleFetch()}
          style={{
            padding: "0 18px",
            border: "none",
            borderRadius: 6,
            background: "#4CC38A",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </div>

      {/* Loading */}
      {loading && <p style={{ fontSize: 14 }}>Loading...</p>}

      {/* Found bag */}
      {created && (
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(31,42,55,0.08)",
            padding: 16,
            overflow: "auto",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>
            Bag <code>{created.bagId}</code>{" "}
            <span
              style={{
                color: STATUS_COLORS[current?.status || ""] || "#374151",
                fontWeight: 600,
              }}
            >
              {current?.status}
            </span>
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <p><strong>Blood Type:</strong> {created.payload?.bloodType}</p>
            <p><strong>Volume:</strong> {created.payload?.volume} ml</p>
            <p>
              <strong>Collection Date:</strong>{" "}
              {new Date(created.payload?.collectionDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Expiry Date:</strong>{" "}
              {new Date(created.payload?.expiryDate).toLocaleDateString()}
            </p>
          </div>

          <h4 style={{ marginTop: 20, marginBottom: 8 }}>Timeline</h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 260,
              overflowY: "auto",
              paddingRight: 6,
            }}
          >
            {history.map((h, idx) => (
              <div
                key={idx}
                style={{
                  padding: "8px 10px",
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <div>
                  <strong style={{ color: STATUS_COLORS[h.status] || "#374151" }}>
                    {h.status}
                  </strong>
                </div>
                <div style={{ color: "#6B7280", fontSize: 12 }}>
                  {new Date(h.ts).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Not found */}
      {!loading && hasSearched && !created && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 8,
            border: "1px solid #FCA5A5",
            background: "#FEF2F2",
            color: "#B91C1C",
            maxWidth: 600,
          }}
        >
          ❌ No record found for Bag ID <code>{bagId}</code>
        </div>
      )}
    </div>
  );
}
