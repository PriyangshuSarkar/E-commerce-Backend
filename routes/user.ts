import { Router } from "express";
import {
  changePassword,
  deleteUser,
  login,
  me,
  signup,
  updateUser,
} from "../controllers/user";
import { authMiddleware } from "../middlewares/auth";

const authRoutes: Router = Router();

authRoutes.post("/signup", signup);

authRoutes.post("/login", login);

authRoutes.get("/me", authMiddleware, me);

authRoutes.put("/change/password", authMiddleware, changePassword);

authRoutes.put("/update", authMiddleware, updateUser);

authRoutes.delete("/delete", authMiddleware, deleteUser);

export default authRoutes;
