import type { infer as infer_ } from "zod";
import type {
  CartItemIdSchema,
  ProductQuantitySchema,
  ProductVariantIdSchema,
} from "../schemas/cart";

export type ProductVariantIdRequest = infer_<typeof ProductVariantIdSchema>;

export type ProductQuantityRequest = infer_<typeof ProductQuantitySchema>;

export type CartItemIdRequest = infer_<typeof CartItemIdSchema>;
