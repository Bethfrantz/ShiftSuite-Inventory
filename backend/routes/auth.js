const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const throwError = (msg, status = 400) => {
  const err = new Error(msg);
  err.statusCode = status;
  throw err;
};

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/* ADMIN: create user (you call this via Postman or an admin UI later) */
router.post("/admin/create-user", async (req, res, next) => {
  try {
    const { name, email, password, role, tenantCode, storeIds } = req.body;

    if (tenantCode !== "ELMOS") {
      throwError("Invalid tenant code", 400);
    }

    const existing = await User.findOne({ email });
    if (existing) throwError("User already exists", 400);

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      tenantCode,
      storeIds,
      activeStoreId: storeIds?.[0] || null,
    });

    res.json({ userId: user._id });
  } catch (err) {
    next(err);
  }
});

/* LOGIN */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password, tenantCode } = req.body;

    const user = await User.findOne({ email, tenantCode });
    if (!user) throwError("Invalid credentials", 401);

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throwError("Invalid credentials", 401);

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        tenantCode: user.tenantCode,
      },
      JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        tenantCode: user.tenantCode,
        storeIds: user.storeIds,
        activeStoreId: user.activeStoreId,
      },
    });
  } catch (err) {
    next(err);
  }
});

/* CURRENT USER */
router.get("/currentUser", async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) throwError("Not authenticated", 401);

    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(payload.userId).populate("storeIds");
    if (!user) throwError("User not found", 404);

    res.json({
      id: user._id,
      name: user.name,
      role: user.role,
      tenantCode: user.tenantCode,
      storeIds: user.storeIds,
      activeStoreId: user.activeStoreId,
    });
  } catch (err) {
    next(err);
  }
});

/* SELECT ACTIVE STORE */
router.post("/selectStore", async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) throwError("Not authenticated", 401);

    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);

    const { storeId } = req.body;

    const user = await User.findById(payload.userId);
    if (!user) throwError("User not found", 404);

    if (!user.storeIds.some((id) => id.toString() === storeId)) {
      throwError("Store not assigned to user", 403);
    }

    user.activeStoreId = storeId;
    await user.save();

    res.json({ activeStoreId: user.activeStoreId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
