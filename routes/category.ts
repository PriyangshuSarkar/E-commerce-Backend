import { Router } from "express";
import {
  addCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
} from "../controllers/category";
import { adminMiddleware } from "../middlewares/admin";
import { authMiddleware } from "../middlewares/auth";

const categoryRoutes: Router = Router();

categoryRoutes.post("/add", [authMiddleware, adminMiddleware], addCategory);

categoryRoutes.put(
  "/update/:categoryId",
  [authMiddleware, adminMiddleware],
  updateCategory
);

categoryRoutes.get("/all", getAllCategories);

categoryRoutes.delete(
  "/delete/:categoryId",
  [authMiddleware, adminMiddleware],
  deleteCategory
);

export default categoryRoutes;
