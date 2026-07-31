import { z } from "zod";
import {
    addressLineField,
    cityField,
    fullNameField,
    phoneField,
} from "./checkout";

export const addressLabelField = z
  .string()
  .trim()
  .min(2, "Label must be at least 2 characters")
  .max(40, "Label is too long");

export const addressCreateSchema = z.object({
  label: addressLabelField,
  fullName: fullNameField,
  phone: phoneField,
  addressLine: addressLineField,
  city: cityField,
  isDefault: z.boolean().default(false),
});

export const addressUpdateSchema = addressCreateSchema.extend({
  id: z.string().uuid(),
});

export const addressIdSchema = z.object({
  id: z.string().uuid(),
});

export type AddressCreateInput = z.infer<typeof addressCreateSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
