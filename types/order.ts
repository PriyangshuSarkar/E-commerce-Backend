import type { infer as infer_ } from "zod";
import type {
  ActionSchema,
  CartItemWithProductSchema,
  CreateOrderSchema,
  OrderIdSchema,
  PageAndLimitSchema,
  PaymentVerificationSchema,
  ProductWithPriceSchema,
  SearchFilterSchema,
  UpdateOrderSchema,
} from "../schemas/order";

export type CreateOrderRequest = infer_<typeof CreateOrderSchema>;

export type PaymentVerificationRequest = infer_<
  typeof PaymentVerificationSchema
>;

export type UpdateOrderRequest = infer_<typeof UpdateOrderSchema>;

export type ProductWithPrice = infer_<typeof ProductWithPriceSchema>;

export type CartItemWithProduct = infer_<typeof CartItemWithProductSchema>;

export type OrderIdRequest = infer_<typeof OrderIdSchema>;

export type SearchFilterRequest = infer_<typeof SearchFilterSchema>;

export type PageAndLimitRequest = infer_<typeof PageAndLimitSchema>;

export type ActionRequest = infer_<typeof ActionSchema>;
