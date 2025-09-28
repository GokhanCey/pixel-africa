import { useState, useCallback } from "react";
import { Hbar, TransferTransaction, TokenAssociateTransaction } from "@hashgraph/sdk";
import { forceFreshConnect, getSignerFor } from "../lib/hashconnect";

const MIRROR = "https://testnet.mirrornode.hedera.com/api/v1";

export function useWallet() {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [accountId, setAccountId] = useState<string>();
  const [balance, setBalance] = useState<number>();
  const [network] = useState("Hedera Testnet");

  const fetchBalance = useCallback(async (aid: string) => {
    const res = await fetch(`${MIRROR}/accounts/${aid}`);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const tiny = Number(data?.balance?.balance ?? 0);
    setBalance(tiny / 1e8);
  }, []);

  const connect = useCallback(async () => {
    await forceFreshConnect(
      async (aid) => {
        setAccountId(aid);
        await fetchBalance(aid);
      },
      () => {
        setAccountId(undefined);
        setBalance(undefined);
      },
      (s) => setStatus(s)
    );
  }, [fetchBalance]);

  const sendHbar = useCallback(
    async (to: string, amount: number) => {
      if (!accountId) throw new Error("Not connected");
      const signer: any = getSignerFor(accountId);

      const tx = await new TransferTransaction()
        .addHbarTransfer(accountId, new Hbar(-amount))
        .addHbarTransfer(to, new Hbar(amount))
        .freezeWithSigner(signer);

      const resp = await (tx as any).executeWithSigner(signer);
      const rec = await resp.getReceiptWithSigner(signer);
      return rec.status?.toString?.();
    },
    [accountId]
  );

  const associateToken = useCallback(
    async (tokenId: string) => {
      if (!accountId) throw new Error("Not connected");
      const signer: any = getSignerFor(accountId);
      const tx = await new TokenAssociateTransaction()
        .setAccountId(accountId)
        .setTokenIds([tokenId])
        .freezeWithSigner(signer);
      const resp = await (tx as any).executeWithSigner(signer);
      const rec = await resp.getReceiptWithSigner(signer);
      return rec.status?.toString?.();
    },
    [accountId]
  );

  return { status, accountId, balance, network, connect, sendHbar, associateToken };
}
