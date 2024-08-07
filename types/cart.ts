import type { infer as infer_ } from "zod";
import type {
  CartItemIdSchema,
  ProductIdSchema,
  ProductQuantitySchema,
} from "../schemas/cart";

export type ProductIdRequest = infer_<typeof ProductIdSchema>;

export type ProductQuantityRequest = infer_<typeof ProductQuantitySchema>;

export type CartItemIdRequest = infer_<typeof CartItemIdSchema>;
