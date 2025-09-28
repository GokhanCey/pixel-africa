import { useState, useMemo } from "react";
import { useWallet } from "../hooks/useWallet";
import { useHcs } from "../hooks/useHcs";
import { QRCodeCanvas } from "qrcode.react";

type ComponentType = "RBC" | "WHOLE_BLOOD" | "PLATELETS" | "PLASMA" | "CRYO";
type Additive = "CPDA-1" | "AS-1" | "AS-3" | "AS-5" | "NA";
type DonationType = "VOLUNTARY" | "REPLACEMENT";

const PRIMARY = "#7BAAF7"; // indigo/blue primary (non-green)

// Derive expiry days by component & additive (US/EU norms; see notes in PR)
function expiryDaysFor(component: ComponentType, additive: Additive): number {
  switch (component) {
    case "RBC":
      if (additive === "CPDA-1") return 35; // RBC CPDA-1
      return 42; // RBC with AS-1/3/5
    case "WHOLE_BLOOD":
      // CPDA-1 whole blood commonly 35 days; if other anticoagulants used, adjust in future
      return 35;
    case "PLATELETS":
      return 5; // 20–24°C standard
    case "PLASMA":
      return 365; // ≤ -18°C, 1 year
    case "CRYO":
      return 365; // typical 12 months (policy may be -25°C/12 mo)
    default:
      return 42;
  }
}

// Informational storage range string for UI/logging
function storageRangeFor(component: ComponentType): string {
  switch (component) {
    case "RBC":
    case "WHOLE_BLOOD":
      return "1–6 °C (refrigerated)";
    case "PLATELETS":
      return "20–24 °C (agitated)";
    case "PLASMA":
    case "CRYO":
      return "≤ −18 °C (frozen)";
    default:
      return "1–6 °C";
  }
}

// Recommended default additive per component
function defaultAdditiveFor(component: ComponentType): Additive {
  if (component === "RBC") return "AS-1";
  if (component === "WHOLE_BLOOD") return "CPDA-1";
  return "NA";
}

export default function Register() {
  const w = useWallet();
  const { submitStatus } = useHcs(w.accountId);

  // mode: single vs batch
  const [mode, setMode] = useState<"SINGLE" | "BATCH">("SINGLE");

  // common fields
  const [componentType, setComponentType] = useState<ComponentType>("RBC");
  const [additive, setAdditive] = useState<Additive>(defaultAdditiveFor("RBC"));
  const [donationType, setDonationType] = useState<DonationType>("VOLUNTARY");

  const [bloodType, setBloodType] = useState("O+");
  const [volume, setVolume] = useState(450);

  const [assignedCourierId, setAssignedCourierId] = useState("");
  const [assignedHospitalId, setAssignedHospitalId] = useState(""); // NEW: hospital authorization
  const [collectionSiteId, setCollectionSiteId] = useState("");

  const [attrLeukoreduced, setAttrLeukoreduced] = useState(true);
  const [attrIrradiated, setAttrIrradiated] = useState(false);
  const [attrCmvNeg, setAttrCmvNeg] = useState(false);

  // single
  const [bagId, setBagId] = useState("");

  // batch
  const [baseId, setBaseId] = useState("");
  const [qty, setQty] = useState(5);

  // results
  const [createdIds, setCreatedIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // keep additive sensible for component
  useMemo(() => {
    setAdditive(defaultAdditiveFor(componentType));
  }, [componentType]);

  const handleRegister = async () => {
    if (!w.accountId) {
      alert("Connect wallet first.");
      return;
    }

    if (!assignedCourierId || !assignedHospitalId) {
      alert("Courier Wallet ID and Hospital Wallet ID are required.");
      return;
    }

    // derive expiry & storage
    const now = new Date();
    const days = expiryDaysFor(componentType, additive);
    const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const commonPayload = {
      componentType,
      additiveSolution: additive,
      storageTempRange: storageRangeFor(componentType),
      donationType,
      bloodType,
      volume,
      collectionDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      assignedCourierId,
      assignedHospitalId,
      collectionSiteId: collectionSiteId || undefined,
      attributes: {
        leukoreduced: attrLeukoreduced,
        irradiated: attrIrradiated,
        cmvNegative: attrCmvNeg,
      },
    };

    setCreating(true);
    const newIds: string[] = [];

    try {
      if (mode === "SINGLE") {
        if (!bagId) {
          alert("Bag ID is required.");
          setCreating(false);
          return;
        }
        await submitStatus(bagId, "CREATED", commonPayload);
        newIds.push(bagId);
      } else {
        if (!baseId || qty < 1) {
          alert("Base ID and quantity are required for batch.");
          setCreating(false);
          return;
        }
        for (let i = 1; i <= qty; i++) {
          const id = `${baseId}-${String(i).padStart(3, "0")}`;
          await submitStatus(id, "CREATED", commonPayload);
          newIds.push(id);
        }
      }
      setCreatedIds(newIds);
    } finally {
      setCreating(false);
    }
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
      <div style={{ width: "100%", maxWidth: 980, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontWeight: 800, fontSize: 24, color: "#0B1020" }}>
          Register Blood Package
        </h1>
        <p style={{ marginTop: 4, fontSize: 13, color: "#6B7280" }}>
          Create a new unit with proper coding, roles and shelf-life. A QR code is generated for scanning.
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
        <div
          style={{
            width: "100%",
            maxWidth: 980,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {/* Left: form */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(31,42,55,0.08)",
              padding: 16,
            }}
          >
            {/* Mode switch */}
            <div
              style={{
                display: "inline-flex",
                background: "#F3F4F6",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              <button
                onClick={() => setMode("SINGLE")}
                style={{
                  padding: "8px 12px",
                  border: "none",
                  cursor: "pointer",
                  background: mode === "SINGLE" ? "#FFFFFF" : "transparent",
                  fontWeight: mode === "SINGLE" ? 700 : 500,
                }}
              >
                Single
              </button>
              <button
                onClick={() => setMode("BATCH")}
                style={{
                  padding: "8px 12px",
                  border: "none",
                  cursor: "pointer",
                  background: mode === "BATCH" ? "#FFFFFF" : "transparent",
                  fontWeight: mode === "BATCH" ? 700 : 500,
                }}
              >
                Batch
              </button>
            </div>

            {mode === "SINGLE" ? (
              <input
                placeholder="Bag ID (Donation/Unit ID)"
                value={bagId}
                onChange={(e) => setBagId(e.target.value)}
                style={{
                  marginBottom: 12,
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 12 }}>
                <input
                  placeholder="Base ID / Prefix (e.g. BAG-2025-ACC)"
                  value={baseId}
                  onChange={(e) => setBaseId(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  placeholder="Qty"
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
              </div>
            )}

            {/* Coding */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Component</label>
                <select
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value as ComponentType)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6 }}
                >
                  <option value="RBC">Red Cells (RBC)</option>
                  <option value="WHOLE_BLOOD">Whole Blood</option>
                  <option value="PLATELETS">Platelets</option>
                  <option value="PLASMA">Plasma</option>
                  <option value="CRYO">Cryoprecipitate</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Preservative / Additive</label>
                <select
                  value={additive}
                  onChange={(e) => setAdditive(e.target.value as Additive)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6 }}
                  disabled={componentType === "PLATELETS" || componentType === "PLASMA" || componentType === "CRYO"}
                  title={componentType === "PLATELETS" || componentType === "PLASMA" || componentType === "CRYO" ? "Not applicable" : ""}
                >
                  <option value="CPDA-1">CPDA-1</option>
                  <option value="AS-1">AS-1</option>
                  <option value="AS-3">AS-3</option>
                  <option value="AS-5">AS-5</option>
                  <option value="NA">N/A</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Donation Type</label>
                <select
                  value={donationType}
                  onChange={(e) => setDonationType(e.target.value as DonationType)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6 }}
                >
                  <option value="VOLUNTARY">Voluntary</option>
                  <option value="REPLACEMENT">Replacement</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Blood Type</label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6 }}
                >
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Volume (ml)</label>
                <input
                  type="number"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Collection Site ID (optional)</label>
                <input
                  placeholder="Site code / center ID"
                  value={collectionSiteId}
                  onChange={(e) => setCollectionSiteId(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6 }}
                />
              </div>
            </div>

            {/* Attributes */}
            <div style={{ marginTop: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label style={{ fontSize: 13 }}>
                <input type="checkbox" checked={attrLeukoreduced} onChange={(e) => setAttrLeukoreduced(e.target.checked)} /> Leukoreduced
              </label>
              <label style={{ fontSize: 13 }}>
                <input type="checkbox" checked={attrIrradiated} onChange={(e) => setAttrIrradiated(e.target.checked)} /> Irradiated
              </label>
              <label style={{ fontSize: 13 }}>
                <input type="checkbox" checked={attrCmvNeg} onChange={(e) => setAttrCmvNeg(e.target.checked)} /> CMV-negative
              </label>
            </div>

            {/* Roles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Courier Wallet ID</label>
                <input
                  placeholder="e.g. 0.0.12345"
                  value={assignedCourierId}
                  onChange={(e) => setAssignedCourierId(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 6 }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Hospital Wallet ID</label>
                <input
                  placeholder="e.g. 0.0.67890"
                  value={assignedHospitalId}
                  onChange={(e) => setAssignedHospitalId(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 6 }}
                />
              </div>
            </div>

            {/* Computed info */}
            <div style={{ marginTop: 10, fontSize: 12, color: "#6B7280" }}>
              <div>
                Storage: <strong>{storageRangeFor(componentType)}</strong>
              </div>
              <div>
                Expiry: <strong>~{expiryDaysFor(componentType, additive)} days</strong> from collection
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={creating}
              style={{
                marginTop: 14,
                padding: "10px 20px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                background: PRIMARY,
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
                width: "fit-content",
                opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? "Creating..." : mode === "SINGLE" ? "Register Unit" : `Register ${qty} Units`}
            </button>
          </div>

          {/* Right: results & QR */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(31,42,55,0.08)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              minHeight: 340,
              maxHeight: "calc(100vh - 180px)",
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 10, fontSize: 16 }}>QR Codes</h3>
            {createdIds.length === 0 ? (
              <p style={{ fontSize: 13, color: "#6B7280" }}>
                Register a unit to see its QR here. In batch mode, all codes appear in a scrollable list.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: 12,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {createdIds.map((id) => (
                  <div
                    key={id}
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      padding: 10,
                      textAlign: "center",
                      background: "#F9FAFB",
                    }}
                  >
                    <QRCodeCanvas value={`${window.location.origin}/verify?bagId=${id}`} size={140} />
                    <div style={{ fontSize: 12, marginTop: 6 }}>
                      <code>{id}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
