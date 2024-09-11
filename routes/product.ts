import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  searchFilterSortAdminProducts,
  searchFilterSortProducts,
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

productRoutes.get("/search", searchFilterSortProducts);

productRoutes.get(
  "/search/admin",
  authMiddleware,
  searchFilterSortAdminProducts
);

export default productRoutes;
