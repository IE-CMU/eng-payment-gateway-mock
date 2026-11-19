import { randomBytes, randomInt } from "node:crypto";

export interface Customer {
  ref2: string;
  token: string;
  project_refno: string;
  project_token: string;
  taxpayer: string;
  cost: string;
  cust_name: string;
  cust_phone: string;
  cust_email: string;
  cust_department: string;
  cust_name2: string;
  cust_address: string;
  created_at: Date;
}

export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED";

export interface Payment {
  ref1: string;
  ref2: string;
  amount: string; // always 2 decimals, e.g. "10.00"
  expire_at: Date;
  numberOfTimes: number;
  qrImage: string;
  paid_at: Date | null;
  forced_expired: boolean;
  created_at: Date;
}

const customers = new Map<string, Customer>();
const payments = new Map<string, Payment>();
let refnoSeq = 0;

function newRef2(): string {
  let ref2: string;
  do {
    ref2 = String(randomInt(1_000_000_000, 10_000_000_000)); // 10 digits, like "6900548489"
  } while (customers.has(ref2));
  return ref2;
}

export const store = {
  createCustomer(data: Omit<Customer, "ref2" | "token" | "project_refno" | "created_at">): Customer {
    refnoSeq += 1;
    const customer: Customer = {
      ...data,
      ref2: newRef2(),
      token: randomBytes(16).toString("hex"),
      project_refno: `PRJ${String(refnoSeq).padStart(6, "0")}`,
      created_at: new Date(),
    };
    customers.set(customer.ref2, customer);
    return customer;
  },

  getCustomer: (ref2: string) => customers.get(ref2),
  getPayment: (ref2: string) => payments.get(ref2),
  savePayment: (payment: Payment) => void payments.set(payment.ref2, payment),

  listAll: () => ({ customers: [...customers.values()], payments: [...payments.values()] }),

  reset() {
    customers.clear();
    payments.clear();
    refnoSeq = 0;
  },
};

export function paymentStatus(p: Payment, now = new Date()): PaymentStatus {
  if (p.paid_at) return "PAID";
  if (p.forced_expired || p.expire_at.getTime() <= now.getTime()) return "EXPIRED";
  return "PENDING";
}
