import { z } from "zod";
import { VEHICLE_STATUSES } from "../types.js";

const currentYear = new Date().getFullYear();

const baseVehicleFields = {
  plate: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z
    .number()
    .int()
    .min(1900, "year >= 1900")
    .max(currentYear + 1, `year <= ${currentYear + 1}`),
  color: z.string().min(1),
  status: z.enum(VEHICLE_STATUSES),
  mileage: z.number().int().nonnegative(),
  purchasedAt: z.coerce.date(),
  ownerId: z.string().uuid().nullable().optional(),
};

export const createVehicleSchema = z.object(baseVehicleFields);
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = z
  .object({
    plate: z.string().min(1).optional(),
    make: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    year: z
      .number()
      .int()
      .min(1900)
      .max(currentYear + 1)
      .optional(),
    color: z.string().min(1).optional(),
    status: z.enum(VEHICLE_STATUSES).optional(),
    mileage: z.number().int().nonnegative().optional(),
    purchasedAt: z.coerce.date().optional(),
    ownerId: z.string().uuid().nullable().optional(),
  })
  .strict();

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
