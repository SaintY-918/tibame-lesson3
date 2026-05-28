export const ROLES = ["ADMIN", "USER"] as const;
export type Role = (typeof ROLES)[number];

export const VEHICLE_STATUSES = ["AVAILABLE", "MAINTENANCE", "RETIRED"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const DEPARTMENTS = [
  "資訊",
  "工務",
  "業務",
  "財務",
  "行政",
  "人資",
  "研發",
  "客服",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const POSITIONS = [
  "總經理",
  "經理",
  "副理",
  "組長",
  "資深工程師",
  "工程師",
  "專員",
  "助理",
  "系統管理員",
] as const;
export type Position = (typeof POSITIONS)[number];

export const VEHICLE_MAKES = [
  "Toyota",
  "Honda",
  "Nissan",
  "Mazda",
  "Ford",
  "Hyundai",
  "BMW",
  "Mercedes-Benz",
  "Tesla",
  "Lexus",
] as const;
export type VehicleMake = (typeof VEHICLE_MAKES)[number];

export const VEHICLE_COLORS = [
  "白",
  "黑",
  "銀",
  "灰",
  "紅",
  "藍",
  "綠",
  "金",
] as const;
export type VehicleColor = (typeof VEHICLE_COLORS)[number];

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
