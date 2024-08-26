import { object, string } from "zod";

export const AddAddressSchema = object({
  name: string(),
  lineOne: string(),
  lineTwo: string().optional(),
  city: string(),
  state: string(),
  country: string(),
  pincode: string().length(6, "Pincode must be exactly 6 characters"),
  email: string().email(),
  phone: string().length(10, "Phone number must be exactly 10 characters"),
});

export const UpdateAddressSchema = object({
  name: string().optional(),
  lineOne: string().optional(),
  lineTwo: string().optional(),
  city: string().optional(),
  state: string().optional(),
  country: string().optional(),
  pincode: string()
    .length(6, "Pincode must be exactly 6 characters")
    .optional(),
  email: string().email().optional(),
  phone: string()
    .length(10, "Phone number must be exactly 10 characters")
    .optional(),
}).superRefine((data) => {
  const hasValue = Object.values(data).some((value) => value !== undefined);
  if (!hasValue) {
    throw new Error("At least one field must be provided for update.");
  }
  return data;
});

export const AddressIdSchema = object({
  addressId: string().optional(),
});
