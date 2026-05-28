import { z } from "zod";
import { EMPLOYEE_STATUSES, ROLES } from "../types.js";

const baseEmployeeFields = {
  employeeNo: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  department: z.string().min(1),
  position: z.string().min(1),
  hiredAt: z.coerce.date(),
  phone: z.string().min(1),
};

export const createEmployeeSchema = z.object({
  ...baseEmployeeFields,
  username: z.string().min(1),
  initialPassword: z.string().min(8, "密碼長度需 >= 8"),
  role: z.enum(ROLES).default("USER"),
  status: z.enum(EMPLOYEE_STATUSES).default("ACTIVE"),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z
  .object({
    employeeNo: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    department: z.string().min(1).optional(),
    position: z.string().min(1).optional(),
    hiredAt: z.coerce.date().optional(),
    phone: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    role: z.enum(ROLES).optional(),
    status: z.enum(EMPLOYEE_STATUSES).optional(),
  })
  .strict();

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
