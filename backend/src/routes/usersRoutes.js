import express from "express";
import {
  register,
  login,
  getUser,
  updateUser,
} from "../controllers/usersController.js";
import auth from "../middleware/auth.js";   // ⬅️ add this line

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// 🔒 Protected routes (requires JWT)
router.get("/:id", auth, getUser);
router.put("/:id", auth, updateUser);

export default router;
