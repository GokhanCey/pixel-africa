import { useCallback } from "react";
import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { getSignerFor } from "../lib/hashconnect";

// Use env var if you want, or hard-code your topic
const TOPIC_ID = import.meta.env.VITE_TOPIC_ID || "0.0.6915475";
const MIRROR = "https://testnet.mirrornode.hedera.com/api/v1";

export type HcsMessage = {
  bagId: string;
  status: string;
  payload: any;
  reportedBy: string;
  ts: number;
};

export function useHcs(accountId?: string | null) {
  const submitStatus = useCallback(
    async (bagId: string, status: string, payload: any = {}) => {
      if (!accountId) throw new Error("Not connected");
      const signer: any = getSignerFor(accountId);

      const message = JSON.stringify({
        bagId,
        status,
        payload,
        reportedBy: accountId,
        ts: Date.now(),
      });

      const tx = await new TopicMessageSubmitTransaction()
        .setTopicId(TOPIC_ID)
        .setMessage(message)
        .freezeWithSigner(signer);

      const resp = await (tx as any).executeWithSigner(signer);
      const receipt = await resp.getReceiptWithSigner(signer);

      return {
        txId: resp.transactionId.toString(),
        status: receipt.status.toString(),
      };
    },
    [accountId]
  );

  const fetchByBag = useCallback(async (bagId: string): Promise<HcsMessage[]> => {
    const res = await fetch(`${MIRROR}/topics/${TOPIC_ID}/messages?limit=200&order=desc`);
    if (!res.ok) throw new Error("Mirror fetch failed");
    const json = await res.json();

    const messages: HcsMessage[] = (json.messages || [])
      .map((m: any) => {
        try {
          const raw = atob(m.message); // base64 decode
          return JSON.parse(raw) as HcsMessage;
        } catch {
          return null;
        }
      })
      .filter((msg: any) => msg && msg.bagId === bagId);

    return messages;
  }, []);

  const fetchRecent = useCallback(async (limit: number = 50): Promise<HcsMessage[]> => {
    const res = await fetch(`${MIRROR}/topics/${TOPIC_ID}/messages?limit=${limit}&order=desc`);
    if (!res.ok) throw new Error("Mirror fetch failed");
    const json = await res.json();

    const messages: HcsMessage[] = (json.messages || [])
      .map((m: any) => {
        try {
          const raw = atob(m.message); // base64 decode
          return JSON.parse(raw) as HcsMessage;
        } catch {
          return null;
        }
      })
      .filter((msg: any) => msg);

    return messages;
  }, []);

  return { submitStatus, fetchByBag, fetchRecent };
}
