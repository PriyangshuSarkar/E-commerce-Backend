import { number, object, string } from "zod";

export const CreateProductSchema = object({
  name: string(),
  description: string(),
  tags: string().array(),
  price: number(),
});

export const UpdateProductSchema = object({
  name: string().optional(),
  description: string().optional(),
  tags: string().array().optional(),
  price: number().optional(),
}).superRefine((data) => {
  const hasValue = Object.values(data).some((value) => value !== undefined);
  if (!hasValue) {
    throw new Error("At least one field must be provided for update.");
  }
  return data;
});
