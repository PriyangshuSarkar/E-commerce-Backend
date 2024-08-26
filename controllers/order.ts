import { type Request, type Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import type {
  CartItemWithProduct,
  CreateOrderRequest,
  OrderIdRequest,
  PageAndLimitRequest,
  PaymentVerificationRequest,
  UpdateOrderRequest,
} from "../types/order";
import { CreateOrderSchema, UpdateOrderSchema } from "../schemas/order";
import { prismaClient } from "../app";
import { razorpay } from "../utils/razorpay";
import crypto from "crypto";

// *Calculate Total Order Amount
export const calculateOrderTotal = tryCatch(
  async (req: Request, res: Response) => {
    const cart = await prismaClient.cart.findFirst({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
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
    const subtotal = item.quantity * +item.productVariant.price; // Updated to use productVariant.price
    return {
      productId: item.productVariant.productId, // Updated to use productVariant.productId
      name: item.productVariant.product.name, // Updated to use productVariant.product.name
      quantity: item.quantity,
      price: +item.productVariant.price, // Updated to use productVariant.price
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
            productVariant: {
              include: {
                product: true,
              },
            },
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

    const options = {
      amount: Math.round(100 * totalAmountDetails.totalAmount),
      currency: "INR",
    };
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create(options);

    const orderDetails = await prismaClient.$transaction(async (prisma) => {
      // Decrease product stock inside the transaction
      await Promise.all(
        cart.items.map(
          async (item) =>
            await prisma.productVariant.update({
              where: { id: item.productVariant.id }, // Updated to use productVariant.id
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            })
        )
      );

      // Create the order in the database
      return prisma.order.create({
        data: {
          razorpayId: razorpayOrder.id,
          userId: req.user.id,
          shippingAddressId: validatedData.shippingAddressId,
          billingAddressId: validatedData.billingAddressId,
          totalAmount: totalAmountDetails.totalAmount,
          status: "PENDING",
          payment: "DUE",
          items: {
            create: cart.items.map((item) => ({
              productVariantId: item.productVariant.id, // Updated to use productVariant.id
              quantity: item.quantity,
              price: item.productVariant.price, // Updated to use productVariant.price
            })),
          },
        },
      });
    });

    return res.status(200).json({ razorpayOrder, orderDetails });
  }
);

// *Validate Payment
export const paymentVerification = async (
  req: Request<{}, {}, PaymentVerificationRequest>,
  res: Response
) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRETS!)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    const updatedOrder = await prismaClient.order.update({
      where: { razorpayId: razorpay_order_id, userId: req.user.id },
      data: { payment: "SUCCESSFUL" },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    const cart = await prismaClient.cart.findFirst({
      where: { userId: req.user.id },
    });
    await prismaClient.cartItem.deleteMany({
      where: { cartId: cart?.id }, // Assuming cartId is the userId
    });

    return res.status(200).json({ signatureIsValid: true, updatedOrder });
  } else {
    // Handle failed payment
    await prismaClient.$transaction(async (prisma) => {
      // Update order status to FAILED
      const order = await prisma.order.update({
        where: { razorpayId: razorpay_order_id, userId: req.user.id },
        data: { payment: "FAILED" },
        include: { items: true },
      });

      if (order) {
        await Promise.all(
          order.items.map(
            async (item) =>
              await prisma.productVariant.update({
                where: { id: item.productVariantId }, // Updated to use productVariantId
                data: {
                  stock: {
                    increment: item.quantity,
                  },
                },
              })
          )
        );
      }
    });
    return res.status(400).json({ signatureIsValid: false });
  }
};

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
          items: {
            include: {
              productVariant: {
                include: {
                  product: true, // Include related product details if needed
                },
              },
            },
          },
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
  async (req: Request<OrderIdRequest, {}, {}>, res: Response) => {
    const order = await prismaClient.order.findFirstOrThrow({
      where:
        req.user.role !== "ADMIN"
          ? { id: req.params.orderId, userId: req.user.id }
          : { id: req.params.orderId },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
          },
        },
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

    const refundOptions = {
      amount: undefined,
      speed: "normal" as "normal" | "optimum" | undefined,
      notes: undefined,
      receipt: undefined,
    };

    const updatedOrder = await prismaClient.$transaction(async (prisma) => {
      await razorpay.payments.refund(order.razorpayId, refundOptions);
      const cancelledOrder = await prisma.order.update({
        where:
          req.user.role !== "ADMIN"
            ? { id: req.params.orderId, userId: req.user.id }
            : { id: req.params.orderId },
        data: { status: "CANCELLED", payment: "REFUNDED" },
      });
      await Promise.all(
        order.items.map(async (item) => {
          await prisma.productVariant.update({
            where: { id: item.productVariantId }, // Updated to use productVariantId
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
