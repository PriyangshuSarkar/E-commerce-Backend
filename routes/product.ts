import { Router } from "express";
import {
  addCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "../controllers/product";
import { authMiddleware } from "../middlewares/auth";
import { adminMiddleware } from "../middlewares/admin";

const productRoutes: Router = Router();

productRoutes.post("/new", [authMiddleware, adminMiddleware], createProduct);

productRoutes.put(
  "/update/:id",
  [authMiddleware, adminMiddleware],
  updateProduct
);

productRoutes.delete(
  "/delete/:id",
  [authMiddleware, adminMiddleware],
  deleteProduct
);

productRoutes.get("/get/all", [authMiddleware, adminMiddleware], listProducts);

productRoutes.get(
  "/get/:id",
  [authMiddleware, adminMiddleware],
  getProductById
);

productRoutes.post(
  "/category/add",
  [authMiddleware, adminMiddleware],
  addCategory
);

productRoutes.delete(
  "/category/delete/:id",
  [authMiddleware, adminMiddleware],
  deleteCategory
);

export default productRoutes;
