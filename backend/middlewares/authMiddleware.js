const jwt = require("jsonwebtoken");

/**
 * Flexible Auth Middleware
 * 
 * Satisfies the requirement:
 * "api can be accessed direct without token" while still verifying JWT when supplied.
 * 
 * 1. If an 'Authorization' header with Bearer token is provided, it verifies the token
 *    and attaches the decoded user info to `req.user`.
 * 2. If NO token is provided, it allows the request to continue directly without blocking,
 *    and checks for a user_id passed in headers ('x-user-id'), query, or body.
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["x-access-token"];
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (authHeader) {
      token = authHeader;
    }

    if (token) {
      // Token is supplied: verify it
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "campus_coin_jwt_secret_key_2026"
      );
      req.user = decoded; // { user_id, email, name }
    } else {
      // Direct access without token allowed
      const directUserId =
        req.headers["x-user-id"] || req.query.user_id || req.body?.user_id;

      if (directUserId) {
        req.user = { user_id: directUserId };
      } else {
        req.user = null;
      }
    }

    next();
  } catch (error) {
    // If a token was provided but is invalid or expired
    return res.status(401).json({
      success: false,
      message: "Invalid or expired JWT token.",
      error: error.message,
    });
  }
};

/**
 * Strict Auth Middleware (Optional helper)
 * Can be used in the future if you want to strictly block routes that have no token.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Authentication token required.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "campus_coin_jwt_secret_key_2026"
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Token is invalid or expired.",
      error: error.message,
    });
  }
};

module.exports = {
  authMiddleware,
  requireAuth,
};
