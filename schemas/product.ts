import { number, object, string } from "zod";

export const CreateProductSchema = object({
  sku: string(),
  name: string(),
  description: string(),
  tags: string().toLowerCase().array(),
  price: string().transform(Number),
  quantity: string().transform(Number),
  categoryId: string(),
  stock: string().transform(Number),
  imageUrl: string(),
});

export const UpdateProductSchema = object({
  sku: string().optional(),
  name: string().optional(),
  description: string().optional(),
  tags: string().toLowerCase().array().optional(),
  price: string().transform(Number).optional(),
  quantity: string().transform(Number).optional(),
  categoryId: string().optional(),
  stock: string().transform(Number).optional(),
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
