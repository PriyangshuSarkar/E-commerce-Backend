import type { infer as infer_ } from "zod";
import type {
  CreateReviewSchema,
  PageAndLimitSchema,
  ProductIdSchema,
  ReviewIdSchema,
  UpdateReviewSchema,
} from "../schemas/review";

export type CreateReviewRequest = infer_<typeof CreateReviewSchema>;

export type UpdateReviewRequest = infer_<typeof UpdateReviewSchema>;

export type ReviewIdRequest = infer_<typeof ReviewIdSchema>;

export type ProductIdRequest = infer_<typeof ProductIdSchema>;

export type PageAndLimitRequest = infer_<typeof PageAndLimitSchema>;
