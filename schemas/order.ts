import { Decimal } from "@prisma/client/runtime/library";
import {
  instanceof as instanceof_,
  object,
  string,
  enum as enum_,
  number,
  date,
  array,
} from "zod";

export const CreateOrderSchema = object({
  shippingAddressId: string(),
  billingAddressId: string(),
  status: enum_(["PENDING"]),
});

export const PaymentVerificationSchema = object({
  razorpay_order_id: string(),
  razorpay_payment_id: string(),
  razorpay_signature: string(),
});

export const UpdateOrderSchema = object({
  payment: enum_(["DUE", "FAILED", "SUCCESSFUL", "REFUNDED"]).optional(),
  status: enum_(["PENDING", "ORDERED"]).optional(),
}).superRefine((data) => {
  const hasValue = Object.values(data).some((value) => value !== undefined);
  if (!hasValue) {
    throw new Error("At least one field must be provided for update.");
  }
  return data;
});

export const ProductWithPriceSchema = object({
  id: string(),
  name: string(),
  price: instanceof_(Decimal),
});

export const CartItemWithProductSchema = object({
  id: string(),
  productVariantId: string(), // Updated to use productVariantId
  productVariant: object({
    id: string(),
    productId: string(),
    product: object({
      id: string(),
      name: string(),
      description: string(),
      discount: object({
        id: string(),
        discount: instanceof_(Decimal),
        type: string(),
        validFrom: date(),
        validTo: date(),
      })
        .array()
        .optional(),
      category: object({
        id: string(),
        name: string(),
        discount: object({
          id: string(),
          discount: instanceof_(Decimal),
          type: string(), // Use a Zod enum if you have one for SaleType
          validFrom: date(), // Convert to Date
          validTo: date(), // Convert to Date
        })
          .array()
          .optional(),
      }),
    }),

    price: instanceof_(Decimal),
  }),
  quantity: number().int().positive(),
});

export const OrderIdSchema = object({
  orderId: string().optional(),
});

export const SearchFilterSchema = object({
  page: string().optional(),
  limit: string().optional(),
  id: string().optional(),
  status: enum_([
    "PENDING",
    "ORDERED",
    "PENDING_CANCELLATION",
    "CANCELLED",
  ]).optional(),
  payment: enum_(["DUE", "FAILED", "SUCCESSFUL", "REFUNDED"]).optional(),
});
export const PageAndLimitSchema = object({
  page: string().optional(),
  limit: string().optional(),
});

export const ActionSchema = object({
  action: enum_(["confirm", "reject"]),
});
