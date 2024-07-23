import type { Request, Response, NextFunction } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import {
  AddAddressSchema,
  ChangeDefaultAddressSchema,
  UpdateAddressSchema,
} from "../schemas/address";
import { prismaClient } from "../app";
import type {
  AddAddressRequest,
  ChangeDefaultAddressRequest,
  UpdateAddressRequest,
} from "../types/address";
import type { Address } from "@prisma/client";

// *AddNewAddress
export const addAddress = tryCatch(
  async (req: Request<{}, {}, AddAddressRequest>, res: Response) => {
    AddAddressSchema.parse(req.body);
    const { lineOne, lineTwo, city, country, pincode, phone } = req.body;
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
  },
);

// *DeleteAddress
export const deleteAddress = tryCatch(
  async (req: Request<{ id?: string }, {}, { id: number }>, res: Response) => {
    const addressId = +req.params.id!;
    const { id: userId } = req.user;
    const address = await prismaClient.address.findUnique({
      where: { id: addressId },
    });
    if (!address) {
      return res.status(404).json({ message: "Address not found!" });
    }
    if (address.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this address!" });
    }
    await prismaClient.address.delete({
      where: { id: addressId },
    });
    return res.status(200).json({ message: "Address deleted successfully." });
  },
);

// *ListAllAddress
export const listAddress = tryCatch(
  async (req: Request<{}, {}, { id: number }>, res: Response) => {
    const addresses = await prismaClient.address.findMany({
      where: {
        userId: req.user.id,
      },
    });
    return res.status(200).json({ addresses });
  },
);

// *Update Address
export const updateAddress = tryCatch(
  async (
    req: Request<{ id?: string }, {}, UpdateAddressRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    UpdateAddressSchema.parse(req.body);
    const newAddress = req.body;
    const existingAddressId = await prismaClient.address.findFirst({
      where: {
        id: +req.params.id!,
      },
    });
    if (!existingAddressId) {
      return res.status(400).json({ error: "Invalid Address id!" });
    }
    if (existingAddressId.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this address!" });
    }
    const updateAddress = await prismaClient.address.update({
      where: { id: +req.params.id! },
      data: newAddress,
    });
    return res.json(updateAddress);
  },
);

// *Change Default Address
export const changeDefaultAddress = tryCatch(
  async (
    req: Request<{}, {}, ChangeDefaultAddressRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    const validatedData = ChangeDefaultAddressSchema.parse(req.body);
    if (validatedData.defaultShippingAddressId) {
      let shippingAddress: Address;
      shippingAddress = await prismaClient.address.findFirstOrThrow({
        where: {
          id: validatedData.defaultShippingAddressId,
        },
      });
      if (shippingAddress.userId != req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not authorized to use this address!" });
      }
    }
    if (validatedData.defaultBillingAddressId) {
      let billingAddress: Address;
      billingAddress = await prismaClient.address.findFirstOrThrow({
        where: {
          id: validatedData.defaultBillingAddressId,
        },
      });
      if (billingAddress.userId != req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not authorized to use this address!" });
      }
    }
    const updatedUser = await prismaClient.user.update({
      where: {
        id: req.user.id,
      },
      data: validatedData,
    });

    return res.json(updatedUser);
  },
);
