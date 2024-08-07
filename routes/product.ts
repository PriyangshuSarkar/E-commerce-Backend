import { Router } from "express";
import {
  addCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  filterAndSortProducts,
  getAllCategories,
  getProductById,
  listProducts,
  searchProducts,
  updateProduct,
} from "../controllers/product";
import { authMiddleware } from "../middlewares/auth";
import { adminMiddleware } from "../middlewares/admin";
import { imageUpload } from "../middlewares/multer";
import { attachFileData } from "../middlewares/attachFile";

const productRoutes: Router = Router();

productRoutes.post(
  "/new",
  [authMiddleware, adminMiddleware],
  imageUpload.array("imageUrls", 5),
  attachFileData,
  createProduct
);

productRoutes.put(
  "/update/:productId",
  [authMiddleware, adminMiddleware],
  imageUpload.array("imageUrls", 5),
  attachFileData,
  updateProduct
);

productRoutes.delete(
  "/delete/:productId",
  [authMiddleware, adminMiddleware],
  deleteProduct
);

productRoutes.get("/get/all", listProducts);

productRoutes.get("/get/:productId", getProductById);

productRoutes.post(
  "/category/add",
  [authMiddleware, adminMiddleware],
  addCategory
);
productRoutes.get("/category/all", getAllCategories);

productRoutes.delete(
  "/category/delete/:categoryId",
  [authMiddleware, adminMiddleware],
  deleteCategory
);

productRoutes.get("/search", searchProducts);

productRoutes.get("/filter", filterAndSortProducts);

export default productRoutes;
