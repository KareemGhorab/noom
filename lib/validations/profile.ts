import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
