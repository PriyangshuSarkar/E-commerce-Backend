import { number, object, string } from "zod";

export const AddAddressSchema = object({
  lineOne: string(),
  lineTwo: string().optional(),
  city: string(),
  country: string(),
  pincode: string().length(6, "Pincode must be exactly 6 characters"),
  phone: string().length(10, "Phone number must be exactly 10 characters"),
});

export const ChangeDefaultAddressSchema = object({
  defaultShippingAddressId: number().optional(),
  defaultBillingAddressId: number().optional(),
}).superRefine((data) => {
  const hasValue = Object.values(data).some((value) => value !== undefined);
  if (!hasValue) {
    throw new Error("At least one field must be provided for update.");
  }
  return data;
});

export const UpdateAddressSchema = object({
  lineOne: string().optional(),
  lineTwo: string().optional(),
  city: string().optional(),
  country: string().optional(),
  pincode: string()
    .length(6, "Pincode must be exactly 6 characters")
    .optional(),
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
