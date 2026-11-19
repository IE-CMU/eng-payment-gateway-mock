import { Router } from "express";
import { paymentStatus, store } from "../store.js";
import { formatBangkok } from "../time.js";

export const pageRouter = Router();

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(body: string): string {
  return `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mock ENG Payment</title>
<style>
  :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
  body { margin: 0; display: grid; place-items: center; min-height: 100vh; padding: 16px; box-sizing: border-box; }
  .card { max-width: 360px; width: 100%; text-align: center; border: 1px solid #8884; border-radius: 12px; padding: 24px; }
  .banner { background: #f59e0b; color: #000; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; }
  img { width: 240px; height: 240px; background: #fff; border-radius: 8px; margin: 16px 0; }
  .amount { font-size: 28px; font-weight: 700; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; text-align: left; font-size: 14px; }
  dt { opacity: .7; } dd { margin: 0; word-break: break-all; }
  .status { font-weight: 700; } .PAID { color: #16a34a; } .EXPIRED { color: #dc2626; } .PENDING { color: #ca8a04; }
  button { margin-top: 16px; width: 100%; padding: 12px; font-size: 16px; border: 0; border-radius: 8px; background: #2563eb; color: #fff; cursor: pointer; }
  button:disabled { opacity: .5; cursor: default; }
</style></head><body><div class="card">${body}</div></body></html>`;
}

// Spec section 8 — originally https://payapi.eng.cmu.ac.th/payment/qr?ref2=xxx
pageRouter.get("/payment/qr", (req, res) => {
  const ref2 = typeof req.query.ref2 === "string" ? req.query.ref2 : "";
  const payment = ref2 ? store.getPayment(ref2) : undefined;
  if (!payment) {
    res.status(404).type("html").send(layout(`<span class="banner">MOCK</span><h2>ไม่พบรายการชำระเงิน</h2><p>ref2: ${esc(ref2) || "-"}</p>`));
    return;
  }

  const status = paymentStatus(payment);
  res.type("html").send(
    layout(`
<span class="banner">MOCK GATEWAY — ไม่มีการตัดเงินจริง</span>
<img src="data:image/png;base64,${payment.qrImage}" alt="QR code">
<div class="amount">฿ ${esc(payment.amount)}</div>
<dl>
  <dt>สถานะ</dt><dd class="status ${status}" id="status">${status}</dd>
  <dt>ref1</dt><dd>${esc(payment.ref1)}</dd>
  <dt>ref2</dt><dd>${esc(payment.ref2)}</dd>
  <dt>หมดอายุ</dt><dd>${formatBangkok(payment.expire_at)}</dd>
  <dt>ชำระเมื่อ</dt><dd>${payment.paid_at ? formatBangkok(payment.paid_at) : "-"}</dd>
</dl>
<button id="pay" ${status === "PENDING" ? "" : "disabled"}>Simulate payment</button>
<script>
  const ref2 = ${JSON.stringify(payment.ref2).replace(/</g, "\\u003c")};
  const initial = ${JSON.stringify(status)};
  document.getElementById("pay").onclick = async (e) => {
    e.target.disabled = true;
    const r = await fetch("/mock/pay?ref2=" + encodeURIComponent(ref2), { method: "POST" });
    if (!r.ok) alert((await r.json()).message);
    location.reload();
  };
  if (initial === "PENDING") setInterval(async () => {
    const r = await fetch("/api/payment/status?ref2=" + encodeURIComponent(ref2));
    if (r.ok && (await r.json()).payment_status !== initial) location.reload();
  }, 3000);
</script>`),
  );
});
