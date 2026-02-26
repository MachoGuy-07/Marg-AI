import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
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

function normalizeUserId(userId) {
  return String(userId || "").trim();
}

function normalizeText(value, maxLength = 120) {
  return String(value || "").trim().slice(0, maxLength);
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
    headline: userDoc.headline || "",
    targetRole: userDoc.targetRole || "",
    timezone: userDoc.timezone || "",
    bio: userDoc.bio || "",
    createdAt: userDoc.createdAt || null,
    updatedAt: userDoc.updatedAt || null,
    lastLoginAt: userDoc.lastLoginAt || null,
    lastLogoutAt: userDoc.lastLogoutAt || null,
    loginHistory: Array.isArray(userDoc.loginHistory) ? userDoc.loginHistory : [],
  };
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
    headline: user.headline || "",
    targetRole: user.targetRole || "",
    timezone: user.timezone || "",
    bio: user.bio || "",
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
    lastLoginAt: user.lastLoginAt || null,
    lastLogoutAt: user.lastLogoutAt || null,
    loginHistory: Array.isArray(user.loginHistory) ? user.loginHistory : [],
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

function buildLoginHistory(history, nextIso) {
  const entries = Array.isArray(history)
    ? history.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  entries.push(nextIso);
  return entries.slice(-120);
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

async function stampMongoLogin(userDoc) {
  const now = new Date();
  const existing = Array.isArray(userDoc.loginHistory)
    ? userDoc.loginHistory.map((entry) => new Date(entry)).filter((entry) => !Number.isNaN(entry.getTime()))
    : [];

  existing.push(now);
  userDoc.lastLoginAt = now;
  userDoc.loginHistory = existing.slice(-120);
  await userDoc.save();
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

  const nowIso = new Date().toISOString();
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: createLocalUserId(),
    name,
    email,
    password: hashedPassword,
    authProvider: "local",
    avatar: "",
    headline: "",
    targetRole: "",
    timezone: "",
    bio: "",
    createdAt: nowIso,
    updatedAt: nowIso,
    lastLoginAt: nowIso,
    lastLogoutAt: null,
    loginHistory: [nowIso],
  };

  users.push(user);
  await writeLocalUsers(users);
  return user;
}

async function loginLocalUser({ email, password }) {
  const users = await readLocalUsers();
  const userIndex = users.findIndex((entry) => normalizeEmail(entry.email) === email);

  if (userIndex === -1) {
    throw createHttpError(400, "Invalid credentials.");
  }

  const user = users[userIndex];

  if (!user.password) {
    throw createHttpError(400, "This account uses Google sign-in. Please use Google.");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw createHttpError(400, "Invalid credentials.");
  }

  const nowIso = new Date().toISOString();
  users[userIndex] = {
    ...user,
    lastLoginAt: nowIso,
    loginHistory: buildLoginHistory(user.loginHistory, nowIso),
    updatedAt: nowIso,
  };

  await writeLocalUsers(users);
  return users[userIndex];
}

async function findLocalUserById(userId) {
  const safeUserId = normalizeUserId(userId);
  if (!safeUserId) return null;
  const users = await readLocalUsers();
  return users.find((entry) => normalizeUserId(entry.id) === safeUserId) || null;
}

async function updateLocalUserById(userId, updater) {
  const safeUserId = normalizeUserId(userId);
  if (!safeUserId) return null;

  const users = await readLocalUsers();
  const index = users.findIndex((entry) => normalizeUserId(entry.id) === safeUserId);
  if (index === -1) return null;

  const previous = users[index];
  const next = updater(previous);
  users[index] = next;
  await writeLocalUsers(users);
  return next;
}

function sanitizeProfilePayload(body = {}) {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = normalizeText(body.name, 80);
    if (!name) throw createHttpError(400, "Name cannot be empty.");
    payload.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(body, "avatar")) {
    payload.avatar = normalizeText(body.avatar, 320);
  }

  if (Object.prototype.hasOwnProperty.call(body, "headline")) {
    payload.headline = normalizeText(body.headline, 120);
  }

  if (Object.prototype.hasOwnProperty.call(body, "targetRole")) {
    payload.targetRole = normalizeText(body.targetRole, 120);
  }

  if (Object.prototype.hasOwnProperty.call(body, "timezone")) {
    payload.timezone = normalizeText(body.timezone, 90);
  }

  if (Object.prototype.hasOwnProperty.call(body, "bio")) {
    payload.bio = normalizeText(body.bio, 500);
  }

  return payload;
}

async function findMongoUserById(userId) {
  const safeUserId = normalizeUserId(userId);
  if (!safeUserId) return null;
  if (!mongoose.Types.ObjectId.isValid(safeUserId)) return null;
  return User.findById(safeUserId);
}

router.get("/config", (req, res) => {
  return res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID),
  });
});

router.post("/register", async (req, res) => {
  const name = normalizeText(req.body?.name, 80);
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

    const now = new Date();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: "local",
      lastLoginAt: now,
      loginHistory: [now],
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

    await stampMongoLogin(user);

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

    const name = normalizeText(tokenInfo.name || tokenInfo.given_name || "Google User", 80);
    const avatar = normalizeText(tokenInfo.picture, 320);
    const googleId = normalizeText(tokenInfo.sub, 120);

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

    await stampMongoLogin(user);

    const token = createToken(user._id);
    return res.json({ token, user: serializeUser(user) });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ error: "Google authentication failed." });
  }
});

router.get("/profile", protect, async (req, res) => {
  const userId = normalizeUserId(req.user?.id);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const mongoUser = await findMongoUserById(userId);
    if (mongoUser) {
      return res.json({ user: serializeUser(mongoUser) });
    }

    const localUser = await findLocalUserById(userId);
    if (localUser) {
      return res.json({ user: serializeLocalUser(localUser) });
    }

    return res.status(404).json({ error: "User not found." });
  } catch (error) {
    if (isMongoUnavailableError(error)) {
      try {
        const localUser = await findLocalUserById(userId);
        if (!localUser) {
          return res.status(404).json({ error: "User not found." });
        }
        return res.json({ user: serializeLocalUser(localUser) });
      } catch (localError) {
        return res.status(500).json({ error: localError.message || "Local profile lookup failed." });
      }
    }

    console.error("Profile fetch error:", error);
    return res.status(500).json({ error: "Failed to load profile." });
  }
});

router.post("/profile/update", protect, async (req, res) => {
  const userId = normalizeUserId(req.user?.id);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let updates;
  try {
    updates = sanitizeProfilePayload(req.body || {});
  } catch (validationError) {
    return res
      .status(validationError.status || 400)
      .json({ error: validationError.message || "Invalid profile update payload." });
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields provided for update." });
  }

  try {
    const mongoUser = await findMongoUserById(userId);
    if (mongoUser) {
      Object.assign(mongoUser, updates);
      await mongoUser.save();
      return res.json({ message: "Profile updated", user: serializeUser(mongoUser) });
    }

    const nowIso = new Date().toISOString();
    const localUser = await updateLocalUserById(userId, (previous) => ({
      ...previous,
      ...updates,
      updatedAt: nowIso,
    }));

    if (localUser) {
      return res.json({ message: "Profile updated", user: serializeLocalUser(localUser) });
    }

    return res.status(404).json({ error: "User not found." });
  } catch (error) {
    if (isMongoUnavailableError(error)) {
      try {
        const nowIso = new Date().toISOString();
        const localUser = await updateLocalUserById(userId, (previous) => ({
          ...previous,
          ...updates,
          updatedAt: nowIso,
        }));

        if (!localUser) {
          return res.status(404).json({ error: "User not found." });
        }

        return res.json({ message: "Profile updated", user: serializeLocalUser(localUser) });
      } catch (localError) {
        return res.status(500).json({ error: localError.message || "Local profile update failed." });
      }
    }

    console.error("Profile update error:", error);
    return res.status(500).json({ error: "Failed to update profile." });
  }
});

router.post("/change-password", protect, async (req, res) => {
  const userId = normalizeUserId(req.user?.id);
  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters long." });
  }

  try {
    const mongoUser = await findMongoUserById(userId);
    if (mongoUser) {
      if (!mongoUser.password || mongoUser.authProvider === "google") {
        return res.status(400).json({ error: "Password change is not available for Google-only accounts." });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, mongoUser.password);
      if (!passwordMatch) {
        return res.status(400).json({ error: "Current password is incorrect." });
      }

      const samePassword = await bcrypt.compare(newPassword, mongoUser.password);
      if (samePassword) {
        return res.status(400).json({ error: "New password must be different from current password." });
      }

      mongoUser.password = await bcrypt.hash(newPassword, 10);
      await mongoUser.save();

      return res.json({ message: "Password updated successfully." });
    }

    const users = await readLocalUsers();
    const index = users.findIndex((entry) => normalizeUserId(entry.id) === userId);
    if (index === -1) {
      return res.status(404).json({ error: "User not found." });
    }

    const localUser = users[index];
    if (!localUser.password || localUser.authProvider === "google") {
      return res.status(400).json({ error: "Password change is not available for Google-only accounts." });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, localUser.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    const samePassword = await bcrypt.compare(newPassword, localUser.password);
    if (samePassword) {
      return res.status(400).json({ error: "New password must be different from current password." });
    }

    users[index] = {
      ...localUser,
      password: await bcrypt.hash(newPassword, 10),
      updatedAt: new Date().toISOString(),
    };
    await writeLocalUsers(users);

    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    if (isMongoUnavailableError(error)) {
      try {
        const users = await readLocalUsers();
        const index = users.findIndex((entry) => normalizeUserId(entry.id) === userId);
        if (index === -1) {
          return res.status(404).json({ error: "User not found." });
        }

        const localUser = users[index];
        if (!localUser.password || localUser.authProvider === "google") {
          return res.status(400).json({ error: "Password change is not available for Google-only accounts." });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, localUser.password);
        if (!passwordMatch) {
          return res.status(400).json({ error: "Current password is incorrect." });
        }

        const samePassword = await bcrypt.compare(newPassword, localUser.password);
        if (samePassword) {
          return res.status(400).json({ error: "New password must be different from current password." });
        }

        users[index] = {
          ...localUser,
          password: await bcrypt.hash(newPassword, 10),
          updatedAt: new Date().toISOString(),
        };
        await writeLocalUsers(users);

        return res.json({ message: "Password updated successfully." });
      } catch (localError) {
        return res.status(500).json({ error: localError.message || "Local password update failed." });
      }
    }

    console.error("Change password error:", error);
    return res.status(500).json({ error: "Failed to update password." });
  }
});

router.post("/logout", protect, async (req, res) => {
  const userId = normalizeUserId(req.user?.id);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const now = new Date();
    const mongoUser = await findMongoUserById(userId);
    if (mongoUser) {
      mongoUser.lastLogoutAt = now;
      await mongoUser.save();
      return res.json({ message: "Logout recorded." });
    }

    const localUser = await updateLocalUserById(userId, (previous) => ({
      ...previous,
      lastLogoutAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }));

    if (localUser) {
      return res.json({ message: "Logout recorded." });
    }

    return res.json({ message: "Logout complete." });
  } catch (error) {
    if (isMongoUnavailableError(error)) {
      try {
        const nowIso = new Date().toISOString();
        await updateLocalUserById(userId, (previous) => ({
          ...previous,
          lastLogoutAt: nowIso,
          updatedAt: nowIso,
        }));
        return res.json({ message: "Logout recorded." });
      } catch (localError) {
        return res.status(500).json({ error: localError.message || "Local logout tracking failed." });
      }
    }

    console.error("Logout tracking error:", error);
    return res.status(500).json({ error: "Failed to record logout." });
  }
});

export default router;
