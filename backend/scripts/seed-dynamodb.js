require("dotenv").config();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "ca-central-1" });
const db = DynamoDBDocumentClient.from(client);

const users = require("../data/users.json");
const products = require("../data/products.json");
const interactions = require("../data/interactions.json");

async function seed() {
  console.log(`Seeding ${users.length} users...`);
  for (const u of users) {
    await db.send(new PutCommand({ TableName: "SmartRec-Users", Item: u }));
    process.stdout.write(".");
  }

  console.log(`\nSeeding ${products.length} products...`);
  for (const p of products) {
    const item = {
      ...p,
      productId: String(p.id), // map id → productId as string
      category: String(p.category),
    };
    await db.send(
      new PutCommand({ TableName: "SmartRec-Products", Item: item }),
    );
    process.stdout.write(".");
  }

  console.log(`\nSeeding ${interactions.length} interactions...`);
  for (const i of interactions) {
    const item = {
      ...i,
      userId: String(i.userId),
      timestampId: `${Date.now()}#${i.id || i.interactionId || Math.random()}`,
    };
    await db.send(
      new PutCommand({ TableName: "SmartRec-Interactions", Item: item }),
    );
    process.stdout.write(".");
  }

  console.log("\n\nDone! All data is live in AWS DynamoDB.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
