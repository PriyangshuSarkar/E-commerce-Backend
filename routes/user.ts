import { Router } from "express";
import { login, me, signup } from "../controllers/user";
import { authMiddleware } from "../middlewares/auth";

const authRoutes: Router = Router();

authRoutes.post("/signup", signup);

authRoutes.post("/login", login);

authRoutes.get("/me", authMiddleware, me);

export default authRoutes;
