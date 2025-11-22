// src/middleware/auth.js
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js"; // use your config loader

export default function auth(req, res, next) {
  const header = req.headers.authorization;
  console.log(">>> auth header:", header);

  if (!header || !header.startsWith("Bearer ")) {
    console.log(">>> No Authorization header or wrong format");
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];

  // quick decode (no verify) so we can inspect payload/time
  const decoded = jwt.decode(token);
  console.log(">>> token decoded (no verify):", decoded);
  console.log(">>> server time (UTC):", new Date().toISOString());
  if (decoded) {
    console.log(">>> token.iat:", decoded.iat, " ->", new Date(decoded.iat * 1000).toISOString());
    console.log(">>> token.exp:", decoded.exp, " ->", new Date(decoded.exp * 1000).toISOString());
  }

  try {
    // allow small clock tolerance (5s) if you want
    const verified = jwt.verify(token, JWT_SECRET, { clockTolerance: 5 });
    req.user = verified;
    next();
  } catch (err) {
    // differentiate expired vs invalid
    console.error(">>> jwt verify error:", err.name, err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}
