import type { infer as infer_ } from "zod";
import {
  AddCategorySchema,
  CategoryIdSchema,
  UpdateCategorySchema,
} from "../schemas/category";

export type CategoryIdRequest = infer_<typeof CategoryIdSchema>;

export type AddCategoryRequest = infer_<typeof AddCategorySchema>;

export type UpdateCategoryRequest = infer_<typeof UpdateCategorySchema>;
