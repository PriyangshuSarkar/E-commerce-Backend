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

reviewRoutes.post("/create/:id", authMiddleware, createReview);

reviewRoutes.get("/get/product/:id", getReviewByProduct);

reviewRoutes.get("/get/:id", getReviewById);

reviewRoutes.put("/update/:id", authMiddleware, updateReview);

reviewRoutes.delete("/delete/:id", authMiddleware, deleteReview);

export default reviewRoutes;
