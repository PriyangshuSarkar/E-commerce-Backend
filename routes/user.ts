import { Router } from "express";
import {
  changePassword,
  changeUserRole,
  confirmEmail,
  deleteUser,
  getAllUsers,
  getUserById,
  login,
  me,
  requestOtp,
  searchUser,
  signup,
  updateUser,
} from "../controllers/user";
import { authMiddleware } from "../middlewares/auth";
import { masterMiddleware } from "../middlewares/master";

const userRoutes: Router = Router();

userRoutes.post("/signup", signup);

userRoutes.get("/confirm/email", confirmEmail);

userRoutes.post("/login", login);

userRoutes.get("/me", authMiddleware, me);

userRoutes.get("/otp", authMiddleware, requestOtp);

userRoutes.put("/change/password", authMiddleware, changePassword);

userRoutes.delete("/delete", authMiddleware, deleteUser);

userRoutes.put("/update", authMiddleware, updateUser);

userRoutes.get("/all", [authMiddleware, masterMiddleware], getAllUsers);

userRoutes.get("/:userId", [authMiddleware, masterMiddleware], getUserById);

userRoutes.put(
  "/change/role/:userId",
  [authMiddleware, masterMiddleware],
  changeUserRole
);

userRoutes.get("/search/fuzzy", [authMiddleware, masterMiddleware], searchUser);

export default userRoutes;
