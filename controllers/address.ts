import { json, type NextFunction, type Request, type Response } from "express";
import { tryCatch } from "../middlewares/tryCatch";
import { AddAddressSchema } from "../schemas/address";
import { prismaClient } from "../app";
import type { AddAddressRequest } from "../types/address";

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

export const listAddress = tryCatch(
  async (req: Request<{}, {}, { id: number }>, res: Response) => {
    console.log(+req.user.id);
    const addresses = await prismaClient.address.findMany({
      where: {
        userId: req.user.id,
      },
    });
    return res.status(200).json({ addresses });
  },
);
