import type { Request, Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { AddAddressSchema, UpdateAddressSchema } from "../schemas/address";
import { prismaClient } from "../app";
import type { AddAddressRequest, UpdateAddressRequest } from "../types/address";
import type { Address } from "@prisma/client";

// *AddNewAddress
export const addAddress = tryCatch(
  async (req: Request<{}, {}, AddAddressRequest>, res: Response) => {
    const validatedData = AddAddressSchema.parse(req.body);
    const { lineOne, lineTwo, city, country, pincode, phone } = validatedData;
    const { id: userId } = req.user;
    const address = await prismaClient.address.create({
      data: {
        lineOne,
        ...(lineTwo && { lineTwo }),
        city,
        country,
        pincode,
        phone,
        userId,
      },
    });
    return res.status(201).json({ address });
  }
);

// *DeleteAddress
export const deleteAddress = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const addressId = req.params.id!;
    const { id: userId } = req.user;
    const address = await prismaClient.address.findUniqueOrThrow({
      where: { id: addressId, deletedAt: null },
    });
    if (address.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this address!" });
    }
    await prismaClient.address.update({
      where: { id: addressId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return res.status(200).json({ message: "Address deleted successfully." });
  }
);

// *ListAllAddress
export const listAddress = tryCatch(async (req: Request, res: Response) => {
  const addresses = await prismaClient.address.findMany({
    where: {
      userId: req.user.id,
      deletedAt: null,
    },
  });
  return res.status(200).json({ addresses });
});

// *Update Address
export const updateAddress = tryCatch(
  async (
    req: Request<{ id?: string }, {}, UpdateAddressRequest>,
    res: Response
  ) => {
    const validatedData = UpdateAddressSchema.parse(req.body);
    const existingAddressId = await prismaClient.address.findUniqueOrThrow({
      where: {
        id: req.params.id!,
        deletedAt: null,
      },
    });
    if (existingAddressId.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this address!" });
    }
    const updateAddress = await prismaClient.address.update({
      where: { id: req.params.id!, deletedAt: null },
      data: validatedData,
    });
    return res.status(201).json({ updateAddress });
  }
);

// *Changing default billing address
export const changeDefaultBillingAddress = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const defaultBillingAddressId = req.params.id!;
    const billingAddress = await prismaClient.address.findUniqueOrThrow({
      where: { id: defaultBillingAddressId, deletedAt: null },
    });
    if (billingAddress.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to use this address!" });
    }
    const updatedUser = await prismaClient.user.update({
      where: { id: req.user.id, deletedAt: null },
      data: { defaultBillingAddressId },
    });
    return res.status(200).json({ updatedUser });
  }
);

// *Changing default shipping address
export const changeDefaultShippingAddress = tryCatch(
  async (req: Request<{ id?: string }>, res: Response) => {
    const defaultShippingAddressId = req.params.id!;

    const shippingAddress = await prismaClient.address.findFirstOrThrow({
      where: { id: defaultShippingAddressId, deletedAt: null },
    });

    if (shippingAddress.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to use this address!" });
    }

    const updatedUser = await prismaClient.user.update({
      where: { id: req.user.id },
      data: { defaultShippingAddressId, deletedAt: null },
    });

    return res.status(200).json({ updatedUser });
  }
);
