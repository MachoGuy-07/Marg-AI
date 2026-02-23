import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_USERS_FILE = path.resolve(__dirname, "../users.json");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function serializeUser(userDoc) {
  return {
    _id: userDoc._id,
    id: String(userDoc._id),
    name: userDoc.name,
    email: userDoc.email,
    avatar: userDoc.avatar || "",
    authProvider: userDoc.authProvider || (userDoc.googleId ? "google" : "local"),
    googleLinked: Boolean(userDoc.googleId),
  };
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isMongoUnavailableError(error) {
  if (!error) return false;
  const text = String(error.message || "").toLowerCase();
  return (
    error.name === "MongooseServerSelectionError" ||
    text.includes("querysrv") ||
    text.includes("server selection") ||
    text.includes("failed to connect") ||
    text.includes("before initial connection is complete") ||
    text.includes("connection")
  );
}

async function readLocalUsers() {
  try {
    const raw = await fs.readFile(LOCAL_USERS_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.users)) return parsed.users;
    return [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalUsers(users) {
  const payload = { users };
  await fs.writeFile(LOCAL_USERS_FILE, JSON.stringify(payload, null, 2), "utf8");
}

function createLocalUserId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function serializeLocalUser(user) {
  return {
    _id: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || "",
    authProvider: user.authProvider || "local",
    googleLinked: Boolean(user.googleId),
  };
}

async function registerLocalUser({ name, email, password }) {
  const users = await readLocalUsers();
  const existing = users.find((entry) => normalizeEmail(entry.email) === email);

  if (existing) {
    if (existing.googleId && !existing.password) {
      throw createHttpError(400, "This email is already registered with Google. Use Google sign-in.");
    }
    throw createHttpError(400, "User already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: createLocalUserId(),
    name,
    email,
    password: hashedPassword,
    authProvider: "local",
    avatar: "",
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeLocalUsers(users);
  return user;
}

async function loginLocalUser({ email, password }) {
  const users = await readLocalUsers();
  const user = users.find((entry) => normalizeEmail(entry.email) === email);

  if (!user) {
    throw createHttpError(400, "Invalid credentials.");
  }

  if (!user.password) {
    throw createHttpError(400, "This account uses Google sign-in. Please use Google.");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw createHttpError(400, "Invalid credentials.");
  }

  return user;
}

router.get("/config", (req, res) => {
  return res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID),
  });
});

router.post("/register", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.googleId && !existingUser.password) {
        return res.status(400).json({
          error: "This email is already registered with Google. Use Google sign-in.",
        });
      }
      return res.status(400).json({ error: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: "local",
    });

    const token = createToken(user._id);
    return res.status(201).json({ token, user: serializeUser(user) });
  } catch (error) {
    if (isMongoUnavailableError(error)) {
      try {
        const user = await registerLocalUser({ name, email, password });
        const token = createToken(user.id);
        return res.status(201).json({ token, user: serializeLocalUser(user) });
      } catch (localError) {
        return res
          .status(localError.status || 500)
          .json({ error: localError.message || "Local register fallback failed." });
      }
    }

    console.error("Register error:", error);
    return res.status(500).json({ error: "Server error." });
  }
});

router.post("/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    if (!user.password) {
      return res
        .status(400)
        .json({ error: "This account uses Google sign-in. Please use Google." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const token = createToken(user._id);
    return res.json({ token, user: serializeUser(user) });
  } catch (error) {
    if (isMongoUnavailableError(error)) {
      try {
        const user = await loginLocalUser({ email, password });
        const token = createToken(user.id);
        return res.json({ token, user: serializeLocalUser(user) });
      } catch (localError) {
        return res
          .status(localError.status || 500)
          .json({ error: localError.message || "Local login fallback failed." });
      }
    }

    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error." });
  }
});

router.post("/google", async (req, res) => {
  try {
    const credential = String(req.body?.credential || "").trim();
    if (!credential) {
      return res.status(400).json({ error: "Google credential is required." });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        error: "Google sign-in is not configured on the server.",
      });
    }

    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!tokenInfoResponse.ok) {
      return res.status(401).json({ error: "Invalid Google credential." });
    }

    const tokenInfo = await tokenInfoResponse.json();

    if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: "Google token audience mismatch." });
    }

    const emailVerified =
      tokenInfo.email_verified === true || tokenInfo.email_verified === "true";
    if (!emailVerified) {
      return res.status(401).json({ error: "Google email is not verified." });
    }

    const email = normalizeEmail(tokenInfo.email);
    if (!email) {
      return res.status(400).json({ error: "Google account email is missing." });
    }

    const name = String(tokenInfo.name || tokenInfo.given_name || "Google User").trim();
    const avatar = String(tokenInfo.picture || "").trim();
    const googleId = String(tokenInfo.sub || "").trim();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        authProvider: "google",
        googleId,
        avatar,
      });
    } else {
      let dirty = false;
      if (googleId && user.googleId !== googleId) {
        user.googleId = googleId;
        dirty = true;
      }
      if (avatar && user.avatar !== avatar) {
        user.avatar = avatar;
        dirty = true;
      }
      if (!user.name && name) {
        user.name = name;
        dirty = true;
      }
      if (dirty) {
        await user.save();
      }
    }

    const token = createToken(user._id);
    return res.json({ token, user: serializeUser(user) });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ error: "Google authentication failed." });
  }
});

export default router;
