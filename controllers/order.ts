import { type Request, type Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import type {
  ActionRequest,
  CartItemWithProduct,
  CreateOrderRequest,
  OrderIdRequest,
  PageAndLimitRequest,
  PaymentVerificationRequest,
  SearchFilterRequest,
  UpdateOrderRequest,
} from "../types/order";
import { CreateOrderSchema, UpdateOrderSchema } from "../schemas/order";
import { prismaClient } from "../app";
import { razorpay } from "../utils/razorpay";
import crypto from "crypto";
import { Decimal } from "@prisma/client/runtime/library";
import { createObjectCsvStringifier } from "csv-writer";
import { format } from "date-fns";

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
                product: {
                  include: {
                    discount: true,
                    category: {
                      include: {
                        discount: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "No items in the cart." });
    }

    const GST = +process.env.GST!;
    const shippingCharge = 99;

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
  const currentDate = new Date();

  const itemSubtotals = cartItems.map((item) => {
    let discount = new Decimal(0);

    // Check for valid product discount
    const validProductDiscount = item.productVariant.product.discount?.find(
      (d) => d.validFrom <= currentDate && d.validTo >= currentDate
    );

    if (validProductDiscount) {
      discount = validProductDiscount.discount;
    } else {
      // Check for valid category discount if no product discount
      const validCategoryDiscount =
        item.productVariant.product.category.discount?.find(
          (d) => d.validFrom <= currentDate && d.validTo >= currentDate
        );

      if (validCategoryDiscount) {
        discount = validCategoryDiscount.discount;
      }
    }

    // Calculate the discount amount
    const discountAmount = item.productVariant.price.times(discount.div(100));
    const discountedPrice = item.productVariant.price.minus(discountAmount);

    const subtotal = item.quantity * +discountedPrice; // Calculate subtotal after discount

    return {
      productId: item.productVariant.productId,
      name: item.productVariant.product.name,
      quantity: item.quantity,
      price: +item.productVariant.price,
      discountAmount: +discountAmount,
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
                product: {
                  include: {
                    category: {
                      include: {
                        discount: true,
                      },
                    },
                    discount: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const GST = +process.env.GST!;
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
    const result = await prismaClient.$transaction(async (prisma) => {
      // Update order in the database
      const updatedOrder = await prisma.order.update({
        where: { razorpayId: razorpay_order_id, userId: req.user.id },
        data: { payment: "SUCCESSFUL" },
      });

      return { updatedOrder };
    });

    const cart = await prismaClient.cart.findFirst({
      where: { userId: req.user.id },
    });
    await prismaClient.cartItem.deleteMany({
      where: { cartId: cart?.id }, // Assuming cartId is the userId
    });

    return res.status(200).json({
      signatureIsValid: true,
      updatedOrder: result.updatedOrder,
    });
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
      data: { status: validatedData.status, payment: validatedData.payment },
    });
    return res.status(200).json({ updatedOrder });
  }
);

// *Get All Orders with filtering options
// !Admin Only or Order Owner
export const getAllOrders = tryCatch(
  async (req: Request<{}, {}, {}, SearchFilterRequest>, res: Response) => {
    const page = +req.query.page! || 1;
    const limit = +req.query.limit! || 5;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }
    const skip = (page - 1) * limit;

    // Define filters based on query parameters
    const filters: any = {};

    if (req.query.id) {
      filters.id = req.query.id;
    }
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.payment) {
      filters.payment = req.query.payment;
    }

    // Restrict to user's own orders if not admin or master
    if (req.user.role !== "ADMIN" && req.user.role !== "MASTER") {
      filters.userId = req.user.id;
    }

    // Fetch count and orders with filters
    const [count, orders] = await prismaClient.$transaction([
      prismaClient.order.count({ where: filters }),
      prismaClient.order.findMany({
        skip,
        take: limit,
        where: filters,
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
        orderBy: {
          createdAt: "desc",
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

// *Get User's Own Orders
// !Order Owner Only
export const getUserOrders = tryCatch(
  async (req: Request<{}, {}, {}, PageAndLimitRequest>, res: Response) => {
    const page = +req.query.page! || 1;
    const limit = +req.query.limit! || 5;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }
    const skip = (page - 1) * limit;

    // Fetch count and user's orders with filters
    const [count, orders] = await prismaClient.$transaction([
      prismaClient.order.count({ where: { userId: req.user.id } }),
      prismaClient.order.findMany({
        skip,
        take: limit,
        where: { userId: req.user.id },
        include: {
          items: {
            include: {
              productVariant: true, // Only include product variant info
            },
          },
        },
        orderBy: {
          createdAt: "desc",
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
    const adminFilter =
      req.user.role !== "ADMIN" || "MASTER" ? { userId: req.user.id } : {};
    const order = await prismaClient.order.findFirstOrThrow({
      where: { id: req.params.orderId, ...adminFilter },
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
    return res.status(200).json({ order: order });
  }
);

// *Request Order Cancellation
// !Order Owner Only
export const requestOrderCancellation = tryCatch(
  async (req: Request<OrderIdRequest>, res: Response) => {
    const orderCondition = { id: req.params.orderId, userId: req.user.id };

    // Fetch the order
    const order = await prismaClient.order.findFirstOrThrow({
      where: orderCondition,
    });

    if (order.status === "CANCELLED") {
      return res.status(400).json({ error: "Order is already cancelled." });
    }

    if (order.status === "PENDING_CANCELLATION") {
      return res
        .status(400)
        .json({ error: "Cancellation has already been requested." });
    }

    // Update order status to 'CANCELLATION_REQUESTED'
    const updatedOrder = await prismaClient.order.update({
      where: orderCondition,
      data: { status: "PENDING_CANCELLATION" },
    });

    return res.status(200).json({
      message: "Cancellation request submitted.",
      order: updatedOrder,
    });
  }
);

// *Confirm or Reject Order Cancellation
// !Admin or Master Only
export const confirmOrderCancellation = tryCatch(
  async (req: Request<OrderIdRequest, {}, ActionRequest>, res: Response) => {
    const orderCondition = { id: req.params.orderId };

    // Fetch the order
    const order = await prismaClient.order.findFirstOrThrow({
      where: orderCondition,
      include: { items: true },
    });

    if (order.status !== "PENDING_CANCELLATION") {
      return res
        .status(400)
        .json({ error: "No cancellation request found for this order." });
    }

    if (req.body.action === "reject") {
      // Reject the cancellation request
      const updatedOrder = await prismaClient.order.update({
        where: orderCondition,
        data: { status: "ORDERED" },
      });

      return res.status(200).json({
        message: "Cancellation request rejected.",
        order: updatedOrder,
      });
    }

    // Process cancellation confirmation
    const updatedOrder = await prismaClient.$transaction(async (prisma) => {
      // Refund the payment
      await razorpay.payments.refund(order.razorpayId, {
        amount: undefined,
        speed: "normal",
        notes: undefined,
        receipt: undefined,
      });

      // Update the order status
      const cancelledOrder = await prisma.order.update({
        where: orderCondition,
        data: { status: "CANCELLED", payment: "REFUNDED" },
      });

      // Update product variant stock
      await Promise.all(
        order.items.map(async (item) => {
          await prisma.productVariant.update({
            where: { id: item.productVariantId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        })
      );

      return { cancelledOrder };
    });

    return res.status(200).json({
      message: "Order cancellation confirmed.",
      order: updatedOrder.cancelledOrder,
    });
  }
);

// *Generate Spreadsheet for Pending Orders and Confirm Them
// !Admin or Master Only
export const confirmAndGenerateOrdersCsv = tryCatch(
  async (req: Request, res: Response) => {
    // Fetch pending orders
    const pendingOrders = await prismaClient.order.findMany({
      where: { status: "PENDING" },
      include: {
        billingAddress: true,
        shippingAddress: true,
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

    if (!pendingOrders.length) {
      return res.status(400).json({ error: "No pending orders found." });
    }

    // Define CSV header
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: "orderId", title: "*Order Id" },
        { id: "orderDate", title: "Order Date as dd-mm-yyyy hh:MM" },
        { id: "channel", title: "*Channel" },
        { id: "paymentMethod", title: "*Payment Method(COD/Prepaid)" },
        { id: "customerFirstName", title: "*Customer First Name" },
        { id: "customerLastName", title: "Customer Last Name" },
        { id: "email", title: "Email (Optional)" },
        { id: "customerMobile", title: "*Customer Mobile" },
        { id: "customerAlternateMobile", title: "Customer Alternate Mobile" },
        { id: "shippingAddressLine1", title: "*Shipping Address Line 1" },
        { id: "shippingAddressLine2", title: "Shipping Address Line 2" },
        { id: "shippingAddressCountry", title: "*Shipping Address Country" },
        { id: "shippingAddressState", title: "*Shipping Address State" },
        { id: "shippingAddressCity", title: "*Shipping Address City" },
        { id: "shippingAddressPostcode", title: "*Shipping Address Postcode" },
        { id: "billingAddressLine1", title: "Billing Address Line 1" },
        { id: "billingAddressLine2", title: "Billing Address Line 2" },
        { id: "billingAddressCountry", title: "Billing Address Country" },
        { id: "billingAddressState", title: "Billing Address State" },
        { id: "billingAddressCity", title: "Billing Address City" },
        { id: "billingAddressPostcode", title: "Billing Address Postcode" },
        { id: "masterSku", title: "*Master SKU" },
        { id: "productName", title: "*Product Name" },
        { id: "productQuantity", title: "*Product Quantity" },
        { id: "taxPercentage", title: "Tax %" },
        {
          id: "sellingPrice",
          title: "*Selling Price(Per Unit Item, Inclusive of Tax)",
        },
        { id: "discount", title: "Discount(Per Unit Item)" },
        { id: "shippingCharges", title: "Shipping Charges(Per Order)" },
        { id: "codCharges", title: "COD Charges(Per Order)" },
        { id: "giftWrapCharges", title: "Gift Wrap Charges(Per Order)" },
        { id: "totalDiscount", title: "Total Discount (Per Order)" },
        { id: "length", title: "*Length (cm)" },
        { id: "breadth", title: "*Breadth (cm)" },
        { id: "height", title: "*Height (cm)" },
        { id: "weight", title: "*Weight Of Shipment(kg)" },
        { id: "sendNotification", title: "Send Notification(True/False)" },
        { id: "comment", title: "Comment" },
        { id: "hsnCode", title: "HSN Code" },
        { id: "locationId", title: "Location Id" },
        { id: "resellerName", title: "Reseller Name" },
        { id: "companyName", title: "Company Name" },
        { id: "latitude", title: "latitude" },
        { id: "longitude", title: "longitude" },
        { id: "verifiedOrder", title: "Verified Order" },
        { id: "isDocuments", title: "Is documents" },
        { id: "orderType", title: "Order Type" },
        { id: "orderTag", title: "Order tag" },
      ],
    });

    // Prepare CSV rows
    const csvRows = pendingOrders.flatMap((order) =>
      order.items.map((item) => ({
        orderId: order.id,
        orderDate: format(order.createdAt, "dd-MM-yyyy HH:mm"),
        channel: "Custom",
        paymentMethod: "Prepaid",
        customerFirstName: order.billingAddress?.name.split(" ")[0] || "",
        customerLastName:
          order.billingAddress?.name.split(" ").slice(1).join(" ") || "",
        email: order.billingAddress?.email || "",
        customerMobile: order.billingAddress?.phone || "",
        customerAlternateMobile: "",
        shippingAddressLine1: order.shippingAddress?.lineOne || "",
        shippingAddressLine2: order.shippingAddress?.lineTwo || "",
        shippingAddressCountry: order.shippingAddress?.country || "",
        shippingAddressState: order.shippingAddress?.state || "",
        shippingAddressCity: order.shippingAddress?.city || "",
        shippingAddressPostcode: order.shippingAddress?.pincode || "",
        billingAddressLine1: order.billingAddress?.lineOne || "",
        billingAddressLine2: order.billingAddress?.lineTwo || "",
        billingAddressCountry: order.billingAddress?.country || "",
        billingAddressState: order.billingAddress?.state || "",
        billingAddressCity: order.billingAddress?.city || "",
        billingAddressPostcode: order.billingAddress?.pincode || "",
        masterSku: item.productVariant.sku,
        productName: item.productVariant.product.name,
        productQuantity: item.quantity,
        taxPercentage: "",
        sellingPrice: item.price,
        discount: "",
        shippingCharges: "",
        codCharges: "",
        giftWrapCharges: "",
        totalDiscount: "",
        length: "10",
        breadth: "10",
        height: "10",
        weight: "0.5",
        sendNotification: "True",
        comment: "",
        hsnCode: "",
        locationId: "",
        resellerName: "",
        companyName: "",
        latitude: "",
        longitude: "",
        verifiedOrder: "1",
        isDocuments: "No",
        orderType: "Essentials",
        orderTag: "",
      }))
    );

    // Generate CSV content
    const csvContent =
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(csvRows);

    // Update orders to confirmed status
    await prismaClient.order.updateMany({
      where: { status: "PENDING" },
      data: { status: "ORDERED" },
    });

    // Set response headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=pending_orders.csv"
    );

    // Send the CSV content
    res.send(csvContent);
  }
);
