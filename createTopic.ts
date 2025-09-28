import { Client, TopicCreateTransaction, PrivateKey } from "@hashgraph/sdk";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const operatorId = process.env.OPERATOR_ID;
  const operatorKey = process.env.OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    throw new Error("Please set OPERATOR_ID and OPERATOR_KEY in your .env file");
  }

  const client = Client.forTestnet().setOperator(
    operatorId,
    PrivateKey.fromString(operatorKey)
  );

  const tx = await new TopicCreateTransaction()
    .setTopicMemo("PixelAfrica blood supply chain")
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const newTopicId = receipt.topicId?.toString();

  console.log("✅ Created Topic:", newTopicId);
}

main().catch((err) => {
  console.error("❌ Error creating topic:", err);
  process.exit(1);
});
