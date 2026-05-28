import { z } from "zod";
import { EMPLOYEE_STATUSES, VEHICLE_STATUSES } from "../types.js";

const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

export const vehicleListQuerySchema = z.object({
  ...pageFields,
  search: z.string().optional(),
  status: z.enum([...VEHICLE_STATUSES, "ALL"] as const).default("ALL"),
});

export type VehicleListQuery = z.infer<typeof vehicleListQuerySchema>;

export const employeeListQuerySchema = z.object({
  ...pageFields,
  search: z.string().optional(),
  department: z.string().optional(),
  status: z.enum([...EMPLOYEE_STATUSES, "ALL"] as const).default("ACTIVE"),
});

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
