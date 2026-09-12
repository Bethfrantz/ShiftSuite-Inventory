// middleware/errorHandler.js

module.exports = (err, req, res, next) => {
  console.error("🔥 Global Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    error: err.message || "Server Error",
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
