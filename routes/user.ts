import { Router } from "express";
import { changePassword, login, me, signup } from "../controllers/user";
import { authMiddleware } from "../middlewares/auth";

const authRoutes: Router = Router();

authRoutes.post("/signup", signup);

authRoutes.post("/login", login);

authRoutes.get("/me", authMiddleware, me);

authRoutes.put("/change/password", authMiddleware, changePassword);

export default authRoutes;
