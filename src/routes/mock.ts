import { Router, type Request } from "express";
import { ApiError } from "../errors.js";
import { ref2Schema } from "../schemas.js";
import { paymentStatus, store, type Payment } from "../store.js";
import { formatBangkok } from "../time.js";

/** Test-control endpoints. Not part of the real API. */
export const mockRouter = Router();

function getRef2(req: Request): string {
  return ref2Schema.parse({ ...req.query, ...(req.body ?? {}) }).ref2;
}

function view(p: Payment) {
  return {
    ref1: p.ref1,
    ref2: p.ref2,
    amount: p.amount,
    numberOfTimes: p.numberOfTimes,
    payment_status: paymentStatus(p),
    expire_at: formatBangkok(p.expire_at),
    paid_at: p.paid_at ? formatBangkok(p.paid_at) : null,
    created_at: formatBangkok(p.created_at),
  };
}

function requirePayment(ref2: string): Payment {
  const payment = store.getPayment(ref2);
  if (!payment) throw new ApiError(404, "Payment not found for ref2");
  return payment;
}

mockRouter.post("/mock/pay", (req, res) => {
  const payment = requirePayment(getRef2(req));
  const status = paymentStatus(payment);
  if (status !== "PENDING") throw new ApiError(409, `Cannot pay: payment is ${status}`);
  payment.paid_at = new Date();
  res.json({ status: "success", payment: view(payment) });
});

mockRouter.post("/mock/expire", (req, res) => {
  const payment = requirePayment(getRef2(req));
  if (paymentStatus(payment) === "PAID") throw new ApiError(409, "Cannot expire: payment is PAID");
  payment.forced_expired = true;
  res.json({ status: "success", payment: view(payment) });
});

mockRouter.post("/mock/reset", (_req, res) => {
  store.reset();
  res.json({ status: "success" });
});

mockRouter.get("/mock/payments", (_req, res) => {
  const { customers, payments } = store.listAll();
  res.json({
    status: "success",
    customers: customers.map((c) => ({ ...c, created_at: formatBangkok(c.created_at) })),
    payments: payments.map(view),
  });
});
