import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  createReview,
  deleteReview,
  getReviewById,
  getReviewByProduct,
  updateReview,
} from "../controllers/review";

const reviewRoutes: Router = Router();

reviewRoutes.post("/create/:productId", authMiddleware, createReview);

reviewRoutes.get("/get/product/:productId", getReviewByProduct);

reviewRoutes.get("/get/:reviewId", getReviewById);

reviewRoutes.put("/update/:reviewId", authMiddleware, updateReview);

reviewRoutes.delete("/delete/:reviewId", authMiddleware, deleteReview);

export default reviewRoutes;
