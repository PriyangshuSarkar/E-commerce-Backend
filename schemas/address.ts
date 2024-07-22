import { number, object, string } from "zod";

export const AddAddressSchema = object({
  lineOne: string(),
  lineTwo: string().optional(),
  city: string(),
  country: string(),
  pincode: string().length(6, "Pincode must be exactly 6 characters"),
  phone: string().length(10, "Phone number must be exactly 10 characters"),
});
