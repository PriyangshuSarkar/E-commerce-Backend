import { Router } from "express";
import {
  changePassword,
  changeUserRole,
  deleteUser,
  getAllUsers,
  getUserById,
  login,
  me,
  searchUser,
  signup,
  updateUser,
} from "../controllers/user";
import { authMiddleware } from "../middlewares/auth";
import { adminMiddleware } from "../middlewares/admin";

const userRoutes: Router = Router();

userRoutes.post("/signup", signup);

userRoutes.post("/login", login);

userRoutes.get("/me", authMiddleware, me);

userRoutes.put("/change/password", authMiddleware, changePassword);

userRoutes.put("/update", authMiddleware, updateUser);

userRoutes.delete("/delete", authMiddleware, deleteUser);

userRoutes.get("/all", [authMiddleware, adminMiddleware], getAllUsers);

userRoutes.get("/:userId", [authMiddleware, adminMiddleware], getUserById);

userRoutes.put("/:userId", [authMiddleware, adminMiddleware], changeUserRole);

userRoutes.get("/search/fuzzy", [authMiddleware, adminMiddleware], searchUser);

export default userRoutes;
