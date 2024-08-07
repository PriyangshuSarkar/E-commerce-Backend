import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import type {
  CartItemWithProduct,
  CreateOrderRequest,
  OrderIdRequest,
  PageAndLimitRequest,
  UpdateOrderRequest,
} from "../types/order";
import { CreateOrderSchema, UpdateOrderSchema } from "../schemas/order";
import { prismaClient } from "../app";

// *Calculate Total Order Amount
export const calculateOrderTotal = tryCatch(
  async (req: Request, res: Response) => {
    const cart = await prismaClient.cart.findFirst({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    if (!cart || cart.items.length == 0) {
      return res.status(400).json({ error: "No items in the cart." });
    }
    const GST = 0.18;
    const shippingCharge = 50;

    const totalAmountDetails = calculateTotalAmount(
      cart.items,
      GST,
      shippingCharge
    );

    return res.status(200).json(totalAmountDetails);
  }
);

// !Helper Function to calculate the amount
const calculateTotalAmount = (
  cartItems: CartItemWithProduct[],
  GST: number,
  shippingCharge: number
) => {
  const itemSubtotals = cartItems.map((item) => {
    const subtotal = item.quantity * +item.product.price;
    return {
      productId: item.productId,
      name: item.product.name,
      quantity: item.quantity,
      price: +item.product.price,
      subtotal,
    };
  });

  const totalItemSubtotal = itemSubtotals.reduce(
    (acc, item) => acc + item.subtotal,
    0
  );
  const taxAmount = totalItemSubtotal * GST;
  const totalAmount = totalItemSubtotal + taxAmount + shippingCharge;

  return {
    itemSubtotals,
    totalItemSubtotal,
    taxAmount,
    shippingCharge,
    totalAmount,
  };
};

// *Create New Order
export const createOrder = tryCatch(
  async (req: Request<{}, {}, CreateOrderRequest>, res: Response) => {
    const validatedData = CreateOrderSchema.parse(req.body);

    const cart = await prismaClient.cart.findFirst({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const GST = 0.18;
    const shippingCharge = 50;
    const totalAmountDetails = calculateTotalAmount(
      cart.items,
      GST,
      shippingCharge
    );

    const orderDetails = await prismaClient.$transaction(async (prisma) => {
      await Promise.all(
        cart.items.map(async (item) => {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        })
      );
      const order = await prisma.order.create({
        data: {
          userId: req.user.id,
          shippingAddressId: validatedData.shippingAddressId,
          billingAddressId: validatedData.billingAddressId,
          totalAmount: totalAmountDetails.totalAmount,
          status: validatedData.status,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
    return res.status(200).json({ orderDetails });
  }
);

// *Update Order
// !Admin Only
export const updateOrder = tryCatch(
  async (
    req: Request<OrderIdRequest, {}, UpdateOrderRequest>,
    res: Response
  ) => {
    const order = await prismaClient.order.findFirstOrThrow({
      where: { id: req.params.orderId },
    });
    if (order.status === "CANCELLED") {
      return res.status(400).json({ error: "Order is already cancelled." });
    }
    const validatedData = UpdateOrderSchema.parse(req.body);
    const updatedOrder = await prismaClient.order.update({
      where: { id: req.params.orderId },
      data: { status: validatedData.status },
    });
    return res.status(200).json({ updatedOrder });
  }
);

// *Get All Orders
// !Admin Only
export const getAllOrders = tryCatch(
  async (req: Request<{}, {}, {}, PageAndLimitRequest>, res: Response) => {
    const page = +req.query.page! || 1;
    const limit = +req.query.limit! || 5;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }
    const skip = (page - 1) * limit;

    const orderFilter =
      req.user.role !== "ADMIN" ? { userId: req.user.id } : {};

    const [count, orders] = await prismaClient.$transaction([
      prismaClient.order.count({ where: orderFilter }),
      prismaClient.order.findMany({
        skip,
        take: limit,
        where: orderFilter,
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
          user: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({
      orders,
      currentPage: page,
      totalPages,
      totalCount: count,
    });
  }
);

// *Get Order By ID
// !Admin Only or Order Owner
export const getOrderById = tryCatch(
  async (
    req: Request<OrderIdRequest, {}, {}, PageAndLimitRequest>,
    res: Response
  ) => {
    const page = +req.query.page! || 1;
    const limit = +req.query.limit! || 5;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }
    const order = await prismaClient.order.findFirstOrThrow({
      where:
        req.user.role !== "ADMIN"
          ? { id: req.params.orderId, userId: req.user.id }
          : { id: req.params.orderId },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        user: true,
      },
    });
    return res.status(200).json({ order });
  }
);

// *Cancel Order
// !Admin Only or Order Owner
export const cancelOrder = tryCatch(
  async (req: Request<OrderIdRequest>, res: Response) => {
    const order = await prismaClient.order.findFirstOrThrow({
      where:
        req.user.role !== "ADMIN"
          ? { id: req.params.orderId, userId: req.user.id }
          : { id: req.params.orderId },
      include: { items: true },
    });
    if (order.status === "CANCELLED") {
      return res.status(400).json({ error: "Order is already cancelled." });
    }

    const updatedOrder = await prismaClient.$transaction(async (prisma) => {
      const cancelledOrder = await prisma.order.update({
        where:
          req.user.role !== "ADMIN"
            ? { id: req.params.orderId, userId: req.user.id }
            : { id: req.params.orderId },
        data: { status: "CANCELLED" },
      });
      await Promise.all(
        order.items.map(async (item) => {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        })
      );

      return cancelledOrder;
    });
    return res.status(200).json({ order: updatedOrder });
  }
);
