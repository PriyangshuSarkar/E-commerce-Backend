import { Router } from "express";
import {
  addCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  filterAndSortProducts,
  getProductById,
  listProducts,
  searchProducts,
  updateProduct,
} from "../controllers/product";
import { authMiddleware } from "../middlewares/auth";
import { adminMiddleware } from "../middlewares/admin";
import { singleUpload } from "../middlewares/multer";

const productRoutes: Router = Router();

productRoutes.post(
  "/new",
  [authMiddleware, adminMiddleware],
  singleUpload.single("imageUrl"),
  createProduct
);

productRoutes.put(
  "/update/:id",
  [authMiddleware, adminMiddleware],
  singleUpload.single("imageUrl"),
  updateProduct
);

productRoutes.delete(
  "/delete/:id",
  [authMiddleware, adminMiddleware],
  deleteProduct
);

productRoutes.get("/get/all", authMiddleware, listProducts);

productRoutes.get("/get/:id", authMiddleware, getProductById);

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

productRoutes.get("/search", searchProducts);

productRoutes.get("/filter", filterAndSortProducts);

export default productRoutes;
