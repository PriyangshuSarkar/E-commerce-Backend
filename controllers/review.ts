import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import type { CreateReviewRequest, UpdateReviewRequest } from "../types/review";
import { prismaClient } from "../app";
import { CreateReviewSchema, UpdateReviewSchema } from "../schemas/review";

// * Create Review Controller
export const createReview = tryCatch(
  async (
    req: Request<{ id?: string }, {}, CreateReviewRequest>,
    res: Response
  ) => {
    if (!req.params.id) {
      return res
        .status(400)
        .json({ error: "Please provide a valid product ID!" });
    }
    const validatedData = CreateReviewSchema.parse(req.body);
    const newReview = await prismaClient.review.create({
      data: {
        userId: req.user.id,
        productId: req.params.id,
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
    req: Request<{ id?: string }, {}, {}, { page?: string; limit?: string }>,
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

    if (!req.params.id) {
      return res
        .status(400)
        .json({ error: "Please provide a valid product ID!" });
    }

    const reviewFilter = { productId: req.params.id, deletedAt: null };

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
  async (
    req: Request<{ id?: string }, {}, {}, { page?: string; limit?: string }>,
    res: Response
  ) => {
    const page = +req.query.page! || 1;
    const limit = +req.query.limit! || 5;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }

    if (!req.params.id) {
      return res
        .status(400)
        .json({ error: "Please provide a valid review ID!" });
    }

    const reviewFilter = { id: req.params.id, deletedAt: null };

    const [count, reviews] = await prismaClient.$transaction([
      prismaClient.review.count({ where: reviewFilter }),
      prismaClient.review.findMany({
        skip: (page - 1) * limit,
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

// * Update Review Controller
export const updateReview = tryCatch(
  async (
    req: Request<{ id?: string }, {}, UpdateReviewRequest>,
    res: Response
  ) => {
    const validatedData = UpdateReviewSchema.parse(req.body);
    const newReview = await prismaClient.review.update({
      where: {
        id: req.params.id,
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
  async (req: Request<{ id?: string }>, res: Response) => {
    await prismaClient.review.update({
      where:
        req.user.role !== "ADMIN"
          ? { id: req.params.id, deletedAt: null, userId: req.user.id }
          : { id: req.params.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return res.status(200).json({ message: "Review Deleted Successfully!" });
  }
);
