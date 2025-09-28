import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useHcs } from "../hooks/useHcs";
import type { HcsMessage } from "../hooks/useHcs";
import QrScanner from "react-qr-barcode-scanner";

const PRIMARY = "#7BAAF7";

const STATUS_COLORS: Record<string, string> = {
  CREATED: "goldenrod",
  IN_TRANSIT: "orange",
  RECEIVED: "green",
  TESTED: "dodgerblue",
  READY: "teal",
  TRANSFUSED: "purple",
  EXPIRED: "red",
  DISCARDED: "gray",
};

export default function Scan() {
  const w = useWallet();
  const { fetchByBag, submitStatus } = useHcs(w.accountId);

  const [bagId, setBagId] = useState("");
  const [history, setHistory] = useState<HcsMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [notes, setNotes] = useState("");

  const handleFetch = async (id?: string) => {
    const targetId = id || bagId;
    if (!targetId) return;
    setLoading(true);
    const msgs = await fetchByBag(targetId);
    setHistory(msgs);
    setBagId(targetId);
    setLoading(false);
  };

  const handleUpdate = async (newStatus: string) => {
    if (!bagId) return;
    if (!w.accountId) {
      alert("Connect your wallet first.");
      return;
    }

    // --- hospital authorization check ---
    const created = history.find((m) => m.status === "CREATED");
    const assignedHospital = created?.payload?.assignedHospitalId;
    if (assignedHospital && w.accountId !== assignedHospital) {
      alert(`Unauthorized: Only hospital ${assignedHospital} can update this bag.`);
      return;
    }

    await submitStatus(bagId, newStatus, { notes });
    setNotes("");
    await handleFetch(bagId);
  };

  const created = history.find((m) => m.status === "CREATED");
  const current = history.length > 0 ? history[0] : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 16px",
        paddingBottom: 100, // space for nav bar
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 860, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontWeight: 800, fontSize: 24, color: "#0B1020" }}>
          Hospital Panel
        </h1>
        <p style={{ marginTop: 4, fontSize: 13, color: "#6B7280" }}>
          Scan or enter a Bag ID to manage blood unit lifecycle. Only the assigned
          hospital wallet can finalize outcomes.
        </p>
      </div>

      {!w.accountId ? (
        <button onClick={w.connect} style={connectBtnStyle}>
          Connect Wallet
        </button>
      ) : (
        <div style={{ width: "100%", maxWidth: 860, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Input / QR */}
          <div style={cardStyle}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                placeholder="Enter Bag ID"
                value={bagId}
                onChange={(e) => setBagId(e.target.value)}
                style={inputStyle}
              />
              <button onClick={() => handleFetch()} style={primaryBtnStyle}>
                {loading ? "Fetching..." : "Fetch"}
              </button>
              <button
                onClick={() => setScanMode(!scanMode)}
                style={{
                  ...btnStyle,
                  background: scanMode ? "#FEE2E2" : "#F3F4F6",
                }}
              >
                {scanMode ? "Close Scanner" : "Scan QR"}
              </button>
            </div>

            {scanMode && (
              <div style={{ marginTop: 10, width: "100%", maxWidth: 400 }}>
                <QrScanner
                  onUpdate={(_, result: any) => {
                    if (result?.getText) {
                      setBagId(result.getText());
                      setScanMode(false);
                      handleFetch(result.getText());
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Bag Info + Actions */}
          {created && (
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: 16 }}>
                Bag <code>{created.bagId}</code>{" "}
                <span style={{ color: STATUS_COLORS[current?.status || ""] }}>
                  ({current?.status})
                </span>
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, fontSize: 14 }}>
                <p><strong>Blood Type:</strong> {created.payload?.bloodType}</p>
                <p><strong>Volume:</strong> {created.payload?.volume} ml</p>
                <p><strong>Component:</strong> {created.payload?.componentType}</p>
                <p><strong>Donation Type:</strong> {created.payload?.donationType}</p>
                <p><strong>Additive:</strong> {created.payload?.additiveSolution}</p>
                <p><strong>Collection:</strong> {new Date(created.payload?.collectionDate).toLocaleString()}</p>
                <p><strong>Expiry:</strong> {new Date(created.payload?.expiryDate).toLocaleDateString()}</p>
                <p><strong>Attributes:</strong> {Object.keys(created.payload?.attributes || {})
                  .filter((k) => created.payload?.attributes?.[k])
                  .join(", ") || "None"}</p>
              </div>

              {/* Notes */}
              <textarea
                placeholder="Optional: doctor/nurse notes (reason for discard, transfusion details, etc.)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: "6px 8px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                  fontSize: 13,
                  minHeight: 40,
                  resize: "vertical",
                }}
              />

              {/* Action Buttons */}
              <h4 style={{ marginTop: 16 }}>Update Status</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button onClick={() => handleUpdate("RECEIVED")} style={{ ...statusBtnStyle, background: "green" }}>Mark Received</button>
                <button onClick={() => handleUpdate("TESTED")} style={{ ...statusBtnStyle, background: "dodgerblue" }}>Mark Tested</button>
                <button onClick={() => handleUpdate("READY")} style={{ ...statusBtnStyle, background: "teal" }}>Mark Ready</button>
                <button onClick={() => handleUpdate("TRANSFUSED")} style={{ ...statusBtnStyle, background: "purple" }}>Mark Transfused</button>
                <button onClick={() => handleUpdate("EXPIRED")} style={{ ...statusBtnStyle, background: "red" }}>Mark Expired</button>
                <button onClick={() => handleUpdate("DISCARDED")} style={{ ...statusBtnStyle, background: "gray" }}>Mark Discarded</button>
              </div>
            </div>
          )}

          {/* Timeline */}
          {history.length > 0 && (
            <div style={{ ...cardStyle, maxHeight: "40vh", overflowY: "auto" }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: 16 }}>History</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {history.map((h, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: STATUS_COLORS[h.status] || "#111827" }}>
                      {h.status}
                    </span>{" "}
                    – {h.payload?.location || ""} – {new Date(h.ts).toLocaleString()} –{" "}
                    <code>{h.reportedBy}</code>
                    {h.payload?.notes && (
                      <div style={{ fontSize: 12, color: "#374151", marginLeft: 12 }}>
                        Notes: {h.payload.notes}
                      </div>
                    )}
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

// --- Styles ---
const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(31,42,55,0.08)",
  padding: 16,
};

const btnStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  cursor: "pointer",
};

const primaryBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: PRIMARY,
  color: "white",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: 6,
};

const connectBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  border: "1px solid #D1D5DB",
  borderRadius: 6,
  background: PRIMARY,
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 24,
};

const statusBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "none",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};
