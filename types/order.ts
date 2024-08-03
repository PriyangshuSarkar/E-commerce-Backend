export interface OrderItemsRequest {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: OrderItemsRequest[];
  shippingAddressId: string;
  billingAddressId: string;
  status: "PENDING";
}

export interface UpdateOrderRequest {
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED";
}
