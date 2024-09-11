import type { infer as infer_ } from "zod";
import type {
  CreateProductSchema,
  PageAndLimitSchema,
  ProductIdSchema,
  SearchFilterSortProductsSchema,
  UpdateProductSchema,
} from "../schemas/product";

export type CreateProductRequest = infer_<typeof CreateProductSchema>;

export type UpdateProductRequest = infer_<typeof UpdateProductSchema>;

export type ProductIdRequest = infer_<typeof ProductIdSchema>;

export type PageAndLimitRequest = infer_<typeof PageAndLimitSchema>;

export type SearchFilterSortProductsRequest = infer_<
  typeof SearchFilterSortProductsSchema
>;
