import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";

dotenv.config();

const fallbackMongoUri = "mongodb://127.0.0.1:27017/ai-interview";

function buildMongoUriFromParts() {
  const directUri = String(process.env.MONGO_URI || "").trim();
  if (directUri) return directUri;

  const user = String(process.env.MONGO_USER || "").trim();
  const password = String(process.env.MONGO_PASSWORD || "").trim();
  const cluster = String(process.env.MONGO_CLUSTER || "").trim();
  const dbName = String(process.env.MONGO_DB_NAME || "ai-interview").trim();

  if (user && password && cluster) {
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    const normalizedCluster = cluster.replace(/^mongodb\+srv:\/\//, "").replace(/^https?:\/\//, "");
    return `mongodb+srv://${encodedUser}:${encodedPassword}@${normalizedCluster}/${dbName}?retryWrites=true&w=majority`;
  }

  return fallbackMongoUri;
}

function buildMongoCandidates() {
  const candidates = [];
  const primary = String(process.env.MONGO_URI || "").trim();
  const direct = String(process.env.MONGO_URI_DIRECT || "").trim();
  const fromParts = buildMongoUriFromParts();

  if (primary) candidates.push(primary);
  if (direct) candidates.push(direct);
  if (!primary && fromParts) candidates.push(fromParts);

  if (candidates.length === 0) {
    candidates.push(fallbackMongoUri);
  }

  return [...new Set(candidates)];
}

const sampleUsers = [
  { name: "Aarav Sharma", email: "aarav.sharma.demo@margai.app", password: "Marg@2026A1" },
  { name: "Vivaan Patel", email: "vivaan.patel.demo@margai.app", password: "Marg@2026B2" },
  { name: "Aditya Verma", email: "aditya.verma.demo@margai.app", password: "Marg@2026C3" },
  { name: "Ishaan Nair", email: "ishaan.nair.demo@margai.app", password: "Marg@2026D4" },
  { name: "Krishna Rao", email: "krishna.rao.demo@margai.app", password: "Marg@2026E5" },
  { name: "Ananya Iyer", email: "ananya.iyer.demo@margai.app", password: "Marg@2026F6" },
  { name: "Diya Singh", email: "diya.singh.demo@margai.app", password: "Marg@2026G7" },
  { name: "Meera Joshi", email: "meera.joshi.demo@margai.app", password: "Marg@2026H8" },
  { name: "Riya Menon", email: "riya.menon.demo@margai.app", password: "Marg@2026J9" },
  { name: "Saanvi Kulkarni", email: "saanvi.kulkarni.demo@margai.app", password: "Marg@2026K0" },
];

async function connectMongo() {
  const mongoCandidates = buildMongoCandidates();
  let lastError = null;

  for (const mongoUri of mongoCandidates) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
      return mongoUri;
    } catch (error) {
      lastError = error;
      if (String(error?.message || "").includes("querySrv")) {
        console.error(
          `SRV DNS lookup failed for ${mongoUri}. Try setting MONGO_URI_DIRECT with standard Atlas URI.`
        );
      }
    }
  }

  throw lastError || new Error("Mongo connection failed");
}

async function seedSampleUsers() {
  const connectedUri = await connectMongo();

  for (const user of sampleUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    await User.updateOne(
      { email: user.email.toLowerCase() },
      {
        $set: {
          name: user.name,
          email: user.email.toLowerCase(),
          password: passwordHash,
          authProvider: "local",
          googleId: null,
        },
      },
      { upsert: true }
    );
  }

  return connectedUri;
}

try {
  const connectedUri = await seedSampleUsers();

  console.log(`Seeded 10 sample users on: ${connectedUri}`);
  for (const user of sampleUsers) {
    console.log(`${user.name} | ${user.email} | ${user.password}`);
  }
} catch (error) {
  console.error("Failed to seed sample users:", error?.message || error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
