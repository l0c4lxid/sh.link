import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please add your MONGODB_URI to your environment variables or .env file.");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const DEFAULT_LINKS = [
  { slug: "q3-promo", dest: "https://marketing.co/campaign/summer-sale-2024-final", domain: "protocl.sh", clicks: 1240, status: "active", createdAt: new Date("2026-05-12") },
  { slug: "beta-access", dest: "https://tally.so/r/n1x20-early-beta-signup", domain: "protocl.sh", clicks: 892, status: "expired", createdAt: new Date("2026-05-04") },
  { slug: "launch", dest: "https://product.site/v1/beta-signup-page", domain: "my-brand.link", clicks: 2104, status: "active", createdAt: new Date("2026-06-01") },
  { slug: "changelog", dest: "https://github.com/acme/repo/releases/v2.4.1", domain: "protocl.sh", clicks: 318, status: "active", createdAt: new Date("2026-06-18") },
  { slug: "hire", dest: "https://notion.so/acme-careers-page-2024", domain: "my-brand.link", clicks: 642, status: "active", createdAt: new Date("2026-04-22") },
];

async function seedDatabase(mongoClient: MongoClient) {
  try {
    const db = mongoClient.db();
    const count = await db.collection("links").countDocuments();
    if (count === 0) {
      console.log("Seeding initial links to MongoDB...");
      await db.collection("links").insertMany(
        DEFAULT_LINKS.map(link => ({
          ...link,
          clickStats: {
            total: link.clicks,
            lastDate: new Date().toISOString().slice(0, 10),
            todayCount: Math.round(link.clicks / 30), // Simulate daily clicks
            history: Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - i);
              return {
                date: d.toISOString().slice(0, 10),
                count: Math.round((link.clicks / 30) * (0.5 + Math.random())),
              };
            }).reverse()
          }
        }))
      );
      console.log("Successfully seeded MongoDB database.");
    }
  } catch (error) {
    console.error("Failed to seed MongoDB database:", error);
  }
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect().then(async (c) => {
      await seedDatabase(c);
      return c;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect().then(async (c) => {
    await seedDatabase(c);
    return c;
  });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
