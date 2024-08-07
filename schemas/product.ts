import { object, string, enum as enum_ } from "zod";

export const CreateProductSchema = object({
  sku: string(),
  name: string(),
  description: string(),
  tags: string().toLowerCase().array(),
  price: string().transform(Number),
  categoryId: string(),
  stock: string().transform(Number),
  imageUrls: string().array().optional(),
});

export const UpdateProductSchema = object({
  sku: string().optional(),
  name: string().optional(),
  description: string().optional(),
  tags: string().toLowerCase().array().optional(),
  price: string().transform(Number).optional(),
  categoryId: string().optional(),
  stock: string().transform(Number).optional(),
  imageUrls: string().array().optional(),
  removeTags: string().array().optional(), /// New image URLs
  removeImageUrls: string().array().optional(), // URLs of images to remove
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

export const ProductIdSchema = object({
  productId: string().optional(),
});

export const CategoryIdSchema = object({
  categoryId: string().optional(),
});

export const PageAndLimitSchema = object({
  page: string().optional(),
  limit: string().optional(),
});

export const SearchQuerySchema = object({
  query: string().optional(),
  page: string().optional(),
  limit: string().optional(),
});

export const FilterAndSortProductsSchema = object({
  page: string().optional(),
  limit: string().optional(),
  category: string().optional(),
  tags: string().array().optional(),
  minPrice: string().optional(),
  maxPrice: string().optional(),
  sortBy: string().optional(),
  sortOrder: enum_(["asc", "desc"]).optional(),
});
