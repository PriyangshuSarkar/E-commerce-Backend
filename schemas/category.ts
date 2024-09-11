import { object, string, enum as enum_ } from "zod";

export const CategoryIdSchema = object({
  categoryId: string().optional(),
});

export const AddCategorySchema = object({
  category: string().toLowerCase(),
});

export const UpdateCategorySchema = object({
  category: string().toLowerCase(),
});
