const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"] || req.headers["x-access-token"];
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (authHeader) {
      token = authHeader;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "campus_coin_jwt_secret_key_2026");
      req.user = decoded;
    } else {
      const directUserId = req.headers["x-user-id"] || req.query.user_id || req.body?.user_id;
      req.user = directUserId ? { user_id: directUserId } : null;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token.", error: error.message });
  }
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication token required." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "campus_coin_jwt_secret_key_2026");
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Token is invalid or expired.", error: error.message });
  }
};

module.exports = { authMiddleware, requireAuth };
