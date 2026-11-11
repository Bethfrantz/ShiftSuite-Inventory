const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const throwError = (msg, status = 400) => {
  const err = new Error(msg);
  err.statusCode = status;
  throw err;
};

/*
=================================================
ADMIN CREATE USER
=================================================
*/
router.post("/admin/create-user", async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      tenantId,
      tenantCode,
      storeIds = [],
    } = req.body;

    if (!tenantId) {
      throwError("tenantId is required");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throwError("User already exists", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      tenantId,
      tenantCode,
      storeIds,
      activeStoreId: storeIds.length > 0 ? storeIds[0] : null,
    });

    res.status(201).json({
      success: true,
      userId: user._id,
    });
  } catch (err) {
    next(err);
  }
});

/*
=================================================
LOGIN
=================================================
*/
router.post("/login", async (req, res, next) => {
  try {
    const { email, password, tenantCode } = req.body;

    const user = await User.findOne({
      email,
      tenantCode,
    })
      .populate("storeIds")
      .populate("tenantId");

    if (!user) {
      throwError("Invalid credentials", 401);
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      throwError("Invalid credentials", 401);
    }

    const token = jwt.sign(
      {
        userId: user._id,
        tenantId: user.tenantId?._id,
        tenantCode: user.tenantCode,
        role: user.role,
        activeStoreId: user.activeStoreId,
      },
      JWT_SECRET,
      {
        expiresIn: "8h",
      },
    );

    res.json({
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,

        tenantId: user.tenantId?._id,

        tenantCode: user.tenantCode,

        storeIds: user.storeIds,

        activeStoreId: user.activeStoreId,
      },
    });
  } catch (err) {
    next(err);
  }
});

/*
=================================================
CURRENT USER
=================================================
*/
router.get("/currentUser", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("storeIds")
      .populate("tenantId");

    if (!user) {
      throwError("User not found", 404);
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,

      tenantId: user.tenantId?._id,

      tenantCode: user.tenantCode,

      storeIds: user.storeIds,

      activeStoreId: user.activeStoreId,
    });
  } catch (err) {
    next(err);
  }
});

/*
=================================================
SELECT ACTIVE STORE
=================================================
*/
router.post("/selectStore", requireAuth, async (req, res, next) => {
  try {
    const { storeId } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      throwError("User not found", 404);
    }

    const hasAccess = user.storeIds.some((id) => id.toString() === storeId);

    if (!hasAccess) {
      throwError("Store not assigned to user", 403);
    }

    user.activeStoreId = storeId;

    await user.save();

    res.json({
      success: true,
      activeStoreId: user.activeStoreId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
