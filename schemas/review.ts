import { number, object, string } from "zod";

export const CreateReviewSchema = object({
  rating: number().min(1).max(5),
  comment: string(),
});

export const UpdateReviewSchema = object({
  rating: number().min(1).max(5).optional(),
  comment: string().optional(),
}).refine((data) => data.rating !== undefined || data.comment !== undefined, {
  message: "At least one of rating or comment must be provided.",
});
