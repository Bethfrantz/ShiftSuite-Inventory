const express = require("express");
const router = express.Router();
const Usage = require("../models/Usage");

router.post("/", async (req, res) => {
  try {
    const usage = await Usage.create(req.body);
    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
