import express from "express";
import { errorHandler, notFoundHandler } from "./errors.js";
import { customerRouter } from "./routes/customer.js";
import { mockRouter } from "./routes/mock.js";
import { pageRouter } from "./routes/page.js";
import { paymentRouter } from "./routes/payment.js";

export function createApp() {
  const app = express();

  // The spec's examples are PHP arrays, so accept both JSON and form-encoded bodies.
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`));
    next();
  });

  app.get("/health", (_req, res) => void res.json({ status: "ok" }));
  app.use(customerRouter);
  app.use(paymentRouter);
  app.use(pageRouter);
  app.use(mockRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
