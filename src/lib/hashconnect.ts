import { HashConnect } from "hashconnect";
import { LedgerId } from "@hashgraph/sdk";

let hc: HashConnect | null = null;

export function getHashConnect() {
  if (!hc) {
    const projectId = import.meta.env.VITE_WC_PROJECT_ID as string;
    if (!projectId) throw new Error("Missing VITE_WC_PROJECT_ID in .env");

    hc = new HashConnect(
      LedgerId.TESTNET,
      projectId,
      {
        name: "Codexa (Testnet)",
        description: "Wallet connect via HashConnect",
        icons: ["https://hashpack.app/favicon.ico"],
        url: window.location.origin,
      },
      true // debug enabled
    );

    (window as any).__hc = hc; // for console checks if needed
  }
  return hc;
}

export async function forceFreshConnect(
  onPaired: (accountId: string) => void,
  onDisconnected: () => void,
  onStatus: (s: "disconnected" | "connecting" | "connected") => void
) {
  try { await (hc as any)?.disconnect?.(); } catch {}

  // wipe cached wc/hc topics in dev to force a clean pairing
  try {
    const ls = window.localStorage;
    const rm: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i)!;
      if (/^hashconnect/i.test(k) || /^hc_/i.test(k) || /^wc@2:/i.test(k) || /^walletconnect/i.test(k)) rm.push(k);
    }
    rm.forEach((k) => ls.removeItem(k));
  } catch {}

  hc = null;
  const _hc = getHashConnect();
  onStatus("connecting");

  (_hc as any).pairingEvent?.removeAllListeners?.();
  (_hc as any).disconnectionEvent?.removeAllListeners?.();
  (_hc as any).connectionStatusChangeEvent?.removeAllListeners?.();

  _hc.connectionStatusChangeEvent.on((s: any) => console.log("[HC] status:", s));

  _hc.pairingEvent.on((pairing: any) => {
    console.log("[HC] pairingEvent:", pairing);
    const aid = pairing?.accountIds?.[0];
    if (aid) { onPaired(aid); onStatus("connected"); }
  });

  _hc.disconnectionEvent.on(() => {
    console.log("[HC] disconnectionEvent");
    onDisconnected();
    onStatus("disconnected");
  });

  console.log("[HC] init() start");
  await _hc.init();
  console.log("[HC] init() resolved");

  setTimeout(() => {
    console.log("[HC] openPairingModal()");
    (_hc as any).openPairingModal();
  }, 400);
}

export function getSignerFor(accountId: string): any {
  const anyHc = getHashConnect() as any;
  return anyHc.getSigner(accountId); // accepts "0.0.x"
}
