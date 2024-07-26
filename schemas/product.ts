import { number, object, string } from "zod";

export const CreateProductSchema = object({
  sku: string(),
  name: string(),
  description: string(),
  tags: string().toLowerCase().array(),
  price: number(),
  quantity: number(),
  categoryId: string(),
  stock: number(),
  imageUrl: string().optional(),
});

export const UpdateProductSchema = object({
  sku: string().optional(),
  name: string().optional(),
  description: string().optional(),
  tags: string().toLowerCase().array().optional(),
  price: number().optional(),
  quantity: number(),
  categoryId: string(),
  stock: number(),
  imageUrl: string().optional(),
}).superRefine((data) => {
  const hasValue = Object.values(data).some((value) => value !== undefined);
  if (!hasValue) {
    throw new Error("At least one field must be provided for update.");
  }
  return data;
});

export const AddCategorySchema = object({
  category: string().toLowerCase(),
});
