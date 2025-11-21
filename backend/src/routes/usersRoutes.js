import express from "express";
import {
  register,
  login,
  getUser,
  updateUser,
} from "../controllers/usersController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/:id", getUser);
router.put("/:id", updateUser);

export default router;
