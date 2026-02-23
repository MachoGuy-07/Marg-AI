import dotenv from "dotenv";
import mongoose from "mongoose";

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

function maskMongoUri(uri) {
  return String(uri).replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}

const mongoCandidates = buildMongoCandidates();
let connected = false;

for (const mongoUri of mongoCandidates) {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log(`Mongo connection OK: ${maskMongoUri(mongoUri)}`);
    connected = true;
    break;
  } catch (error) {
    console.error(`Mongo connection FAILED: ${maskMongoUri(mongoUri)}`);
    console.error(error?.message || error);
    if (String(error?.message || "").includes("querySrv")) {
      console.error("SRV DNS failed. Set MONGO_URI_DIRECT with Atlas standard URI.");
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (!connected) {
  process.exitCode = 1;
}
