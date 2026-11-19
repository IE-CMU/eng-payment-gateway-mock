import { Router } from "express";
import QRCode from "qrcode";
import { config } from "../config.js";
import { ApiError } from "../errors.js";
import { createPaymentSchema, ref2Schema } from "../schemas.js";
import { paymentStatus, store } from "../store.js";
import { formatBangkok, parseBangkok } from "../time.js";

export const paymentRouter = Router();

export function hostedPageUrl(ref2: string): string {
  return `${config.publicBaseUrl}/payment/qr?ref2=${encodeURIComponent(ref2)}`;
}

// Spec step 2 — originally https://payapi.eng.cmu.ac.th/api/payment/create
paymentRouter.post("/api/payment/create", async (req, res) => {
  const body = createPaymentSchema.parse(req.body ?? {});

  if (body.apptoken !== config.apptoken) throw new ApiError(401, "Invalid apptoken");
  if (body.ref1 !== config.ref1) throw new ApiError(401, "Invalid ref1");

  const customer = store.getCustomer(body.ref2);
  if (!customer) throw new ApiError(404, "ref2 not found; register the customer first");
  if (customer.cost !== body.amount) {
    throw new ApiError(400, `amount ${body.amount} does not match registered cost ${customer.cost}`);
  }

  const expireAt = parseBangkok(body.expiryDate);
  if (!expireAt) throw new ApiError(400, 'expiryDate must be "YYYY-MM-DD HH:mm:ss"');
  if (expireAt.getTime() <= Date.now()) throw new ApiError(400, "expiryDate must be in the future");

  const existing = store.getPayment(body.ref2);
  if (existing && paymentStatus(existing) === "PAID") {
    throw new ApiError(409, "Payment for this ref2 is already PAID");
  }

  // QR encodes the hosted page URL so scanning it on a phone opens the "Simulate payment" page.
  const png = await QRCode.toBuffer(hostedPageUrl(body.ref2), { type: "png", margin: 2, width: 300 });
  const payment = {
    ref1: body.ref1,
    ref2: body.ref2,
    amount: body.amount,
    expire_at: expireAt,
    numberOfTimes: body.numberOfTimes,
    qrImage: png.toString("base64"),
    paid_at: null,
    forced_expired: false,
    created_at: new Date(),
  };
  store.savePayment(payment);

  res.json({
    status: "success",
    ref1: payment.ref1,
    ref2: payment.ref2,
    amount: Number(payment.amount), // number here, per spec example
    qrImage: payment.qrImage,
    expire_at: formatBangkok(payment.expire_at),
  });
});

// Spec step 3 — originally https://payapi.eng.cmu.ac.th/api/payment/status
paymentRouter.get("/api/payment/status", (req, res) => {
  const { ref2 } = ref2Schema.parse(req.query);
  const payment = store.getPayment(ref2);
  if (!payment) throw new ApiError(404, "Payment not found for ref2");

  res.json({
    status: "success",
    payment_status: paymentStatus(payment),
    ref1: payment.ref1,
    ref2: payment.ref2,
    amount: payment.amount, // string here, per spec example
    expire_at: formatBangkok(payment.expire_at),
    paid_at: payment.paid_at ? formatBangkok(payment.paid_at) : null,
  });
});
