import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import type {
  CreateReviewRequest,
  PageAndLimitRequest,
  ProductIdRequest,
  ReviewIdRequest,
  UpdateReviewRequest,
} from "../types/review";
import { prismaClient } from "../app";
import { CreateReviewSchema, UpdateReviewSchema } from "../schemas/review";

// * Create Review Controller
export const createReview = tryCatch(
  async (
    req: Request<ProductIdRequest, {}, CreateReviewRequest>,
    res: Response
  ) => {
    const product = await prismaClient.product.findUnique({
      where: { id: req.params.productId },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found!" });
    }
    const validatedData = CreateReviewSchema.parse(req.body);
    const newReview = await prismaClient.review.create({
      data: {
        userId: req.user.id,
        productId: product.id,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
    });
    return res.status(200).json({ newReview });
  }
);

// * Get All Reviews By Product ID Controller
export const getReviewByProduct = tryCatch(
  async (
    req: Request<ProductIdRequest, {}, {}, PageAndLimitRequest>,
    res: Response
  ) => {
    const page = +req.query.page! || 1;
    const limit = +req.query.limit! || 5;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }
    const skip = (page - 1) * limit;

    const product = await prismaClient.product.findUnique({
      where: { id: req.params.productId },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found!" });
    }

    const reviewFilter = { productId: product.id, deletedAt: null };

    const [count, reviews] = await prismaClient.$transaction([
      prismaClient.review.count({ where: reviewFilter }),
      prismaClient.review.findMany({
        skip,
        take: limit,
        where: reviewFilter,
        include: { user: true, product: true },
      }),
    ]);

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({
      reviews,
      currentPage: page,
      totalPages,
      totalCount: count,
    });
  }
);

// * Get Review By ID Controller
export const getReviewById = tryCatch(
  async (req: Request<ReviewIdRequest>, res: Response) => {
    const review = await prismaClient.review.findMany({
      where: { id: req.params.reviewId, deletedAt: null },
      include: { user: true, product: true },
    });

    return res.status(200).json({ review });
  }
);

// * Update Review Controller
export const updateReview = tryCatch(
  async (
    req: Request<ReviewIdRequest, {}, UpdateReviewRequest>,
    res: Response
  ) => {
    const validatedData = UpdateReviewSchema.parse(req.body);
    const newReview = await prismaClient.review.update({
      where: {
        id: req.params.reviewId,
        userId: req.user.id,
        deletedAt: null,
      },
      data: validatedData,
    });
    return res.status(200).json({ newReview });
  }
);

// * Soft Delete Review Controller
export const deleteReview = tryCatch(
  async (req: Request<ReviewIdRequest>, res: Response) => {
    await prismaClient.review.update({
      where:
        req.user.role !== "ADMIN"
          ? { id: req.params.reviewId, deletedAt: null, userId: req.user.id }
          : { id: req.params.reviewId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return res.status(200).json({ message: "Review Deleted Successfully!" });
  }
);
