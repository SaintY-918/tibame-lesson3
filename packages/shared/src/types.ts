export const ROLES = ["ADMIN", "USER"] as const;
export type Role = (typeof ROLES)[number];

export const VEHICLE_STATUSES = ["AVAILABLE", "MAINTENANCE", "RETIRED"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  employeeId: string;
  email: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
