import { Router } from "express";
import { adminMiddleware } from "../middlewares/admin";
import { authMiddleware } from "../middlewares/auth";
import {
  createCategoryDiscount,
  createProductDiscount,
  deleteCategoryDiscount,
  deleteProductDiscount,
  getCategoryDiscount,
  getProductDiscount,
  updateCategoryDiscount,
  updateProductDiscount,
} from "../controllers/discount";

const discountRoutes: Router = Router();

discountRoutes.get("/get/product/:productId", getProductDiscount);

discountRoutes.post(
  "/add/product/:productId",
  [authMiddleware, adminMiddleware],
  createProductDiscount
);

discountRoutes.put(
  "/update/:productDiscountId/product",
  [authMiddleware, adminMiddleware],
  updateProductDiscount
);

discountRoutes.put(
  "/delete/:productDiscountId/product",
  [authMiddleware, adminMiddleware],
  deleteProductDiscount
);

discountRoutes.get("/get/category/:categoryId", getCategoryDiscount);

discountRoutes.post(
  "/add/category/:categoryId",
  [authMiddleware, adminMiddleware],
  createCategoryDiscount
);

discountRoutes.put(
  "/update/:categoryDiscountId/category",
  [authMiddleware, adminMiddleware],
  updateCategoryDiscount
);

discountRoutes.put(
  "/delete/:categoryDiscountId/category",
  [authMiddleware, adminMiddleware],
  deleteCategoryDiscount
);

export default discountRoutes;
