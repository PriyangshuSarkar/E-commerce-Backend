import type { infer as infer_ } from "zod";
import {
  AddAddressSchema,
  AddressIdSchema,
  UpdateAddressSchema,
} from "../schemas/address";

export type AddAddressRequest = infer_<typeof AddAddressSchema>;

export type UpdateAddressRequest = infer_<typeof UpdateAddressSchema>;

export type AddressIdRequest = infer_<typeof AddressIdSchema>;
