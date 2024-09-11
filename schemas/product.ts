import { object, string, enum as enum_ } from "zod";

export const CreateProductSchema = object({
  name: string(),
  description: string(),
  tags: string().toLowerCase().array(),
  categoryId: string(),
  imageUrls: string().array().optional(),
  variants: object({
    sku: string(),
    size: string(),
    price: string().transform(Number),
    stock: string().transform(Number),
  }).array(),
});

export const UpdateProductSchema = object({
  name: string().optional(),
  description: string().optional(),
  tags: string().toLowerCase().array().optional(),
  categoryId: string().optional(),
  imageUrls: string().array().optional(),
  variants: object({
    sku: string().optional(),
    size: string().optional(),
    price: string().transform(Number).optional(),
    stock: string().transform(Number).optional(),
  })
    .array()
    .optional(),
  removeVariants: object({
    sku: string().optional(),
  })
    .array()
    .optional(),
  removeTags: string().array().optional(), /// New image URLs
  removeImageUrls: string().array().optional(), // URLs of images to remove
}).superRefine((data) => {
  const hasValue = Object.values(data).some((value) => value !== undefined);
  if (!hasValue) {
    throw new Error("At least one field must be provided for update.");
  }
  return data;
});

export const ProductIdSchema = object({
  productId: string().optional(),
});

export const PageAndLimitSchema = object({
  page: string().optional(),
  limit: string().optional(),
});

export const SearchFilterSortProductsSchema = object({
  query: string().optional(),
  page: string().optional(),
  limit: string().optional(),
  category: string().optional(),
  tags: string().array().optional(),
  minPrice: string().optional(),
  maxPrice: string().optional(),
  sortBy: string().optional(),
  sortOrder: enum_(["asc", "desc"]).optional(),
});
