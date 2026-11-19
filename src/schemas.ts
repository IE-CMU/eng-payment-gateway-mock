import { z } from "zod";

/** Money: number or numeric string, positive, at most 2 decimals. Normalized to "10.00". */
export const money = z
  .union([z.number(), z.string().trim()])
  .transform((v) => String(v))
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "must be a positive amount with at most 2 decimals")
  .refine((v) => Number(v) > 0, "must be greater than 0")
  .transform((v) => Number(v).toFixed(2));

const str = z.coerce.string().trim();
const required = z.preprocess((v) => v ?? "", str.min(1, "is required"));

export const createCustomerSchema = z.object({
  project_token: required,
  taxpayer: str.default(""),
  cost: money,
  cust_name: required,
  cust_phone: str.default(""),
  cust_email: str.default(""),
  cust_department: str.default(""),
  cust_name2: str.default(""),
  cust_address: str.default(""),
});

export const createPaymentSchema = z.object({
  apptoken: required,
  ref1: required,
  ref2: required,
  amount: money,
  expiryDate: required,
  numberOfTimes: z.coerce.number().int().min(1).default(1),
});

export const ref2Schema = z.object({ ref2: required });
