import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useHcs } from "../hooks/useHcs";
import type { HcsMessage } from "../hooks/useHcs";

const PRIMARY = "#7BAAF7";

const PRESET_EVENTS = [
  "Picked up from collection site",
  "Left collection center",
  "Arrived at checkpoint",
  "Arrived at hub",
  "Delivered to hospital",
];

export default function Transit() {
  const w = useWallet();
  const { submitStatus, fetchByBag } = useHcs(w.accountId);

  const [bagId, setBagId] = useState("");
  const [preset, setPreset] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<HcsMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [authorizedCourier, setAuthorizedCourier] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!bagId) return;
    setLoading(true);
    const msgs = await fetchByBag(bagId);
    setHistory(msgs);
    setLoading(false);

    if (msgs.length > 0) {
      const createdEvent = msgs.find((m) => m.status === "CREATED");
      setAuthorizedCourier(createdEvent?.payload?.assignedCourierId || null);
    }
  };

  const handleUpdate = async () => {
    if (!bagId || (!preset && !note)) return;
    if (!authorizedCourier) {
      alert("No courier assigned for this bag.");
      return;
    }
    if (w.accountId !== authorizedCourier) {
      alert("❌ You are not authorized to update transit for this bag.");
      return;
    }

    const location = [preset, note].filter(Boolean).join(" – ");

    await submitStatus(bagId, "IN_TRANSIT", { location });
    setPreset("");
    setNote("");
    await handleFetch();
  };

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 16px 0",
      }}
    >
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 860, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontWeight: 800, fontSize: 24, color: "#0B1020" }}>
          Transit Updates
        </h1>
        <p style={{ marginTop: 4, fontSize: 13, color: "#6B7280" }}>
          Couriers can log transport updates for blood packages. Use quick-select
          events or add custom notes if needed.
        </p>
      </div>

      {!w.accountId ? (
        <button
          onClick={w.connect}
          style={{
            padding: "10px 20px",
            border: "1px solid #D1D5DB",
            borderRadius: 6,
            background: PRIMARY,
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 24,
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div style={{ width: "100%", maxWidth: 860, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Bag ID input */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(31,42,55,0.08)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                placeholder="Enter Bag ID"
                value={bagId}
                onChange={(e) => setBagId(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                }}
              />
              <button
                onClick={handleFetch}
                style={{
                  padding: "10px 16px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  background: PRIMARY,
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Fetch
              </button>
            </div>

            {authorizedCourier && (
              <p style={{ fontSize: 13, margin: 0 }}>
                Assigned Courier:{" "}
                <span
                  style={{
                    background: w.accountId === authorizedCourier ? "#DCFCE7" : "#FEE2E2",
                    color: w.accountId === authorizedCourier ? "#166534" : "#991B1B",
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {authorizedCourier}
                </span>
              </p>
            )}
          </div>

          {/* Update form */}
          {history.length > 0 && (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(31,42,55,0.08)",
                padding: 16,
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", fontSize: 16 }}>Add Transit Update</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                  }}
                >
                  <option value="">Choose event...</option>
                  {PRESET_EVENTS.map((ev) => (
                    <option key={ev} value={ev}>
                      {ev}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Optional note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                  }}
                />
              </div>
              <button
                onClick={handleUpdate}
                style={{
                  marginTop: 12,
                  padding: "10px 20px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  background: PRIMARY,
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Add Update
              </button>
            </div>
          )}

          {/* Timeline */}
          {history.length > 0 && (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(31,42,55,0.08)",
                padding: 16,
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", fontSize: 16 }}>Timeline</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {history.map((h, idx) => (
                  <li
                    key={idx}
                    style={{
                      marginBottom: 12,
                      paddingLeft: 12,
                      borderLeft: "3px solid #7BAAF7",
                      position: "relative",
                      animation: "fadeIn 0.4s ease",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {h.payload?.location || h.status}
                    </span>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>
                      {new Date(h.ts).toLocaleString()} –{" "}
                      <code>{h.reportedBy}</code>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
