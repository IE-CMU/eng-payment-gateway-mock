import { Router } from "express";
import { config } from "../config.js";
import { ApiError } from "../errors.js";
import { createCustomerSchema } from "../schemas.js";
import { store } from "../store.js";

export const customerRouter = Router();

// Spec step 1 — originally https://payment.eng.cmu.ac.th/api/customer/create.php
customerRouter.post("/api/customer/create.php", (req, res) => {
  const body = createCustomerSchema.parse(req.body ?? {});
  if (body.project_token !== config.projectToken) {
    throw new ApiError(401, "Invalid project_token");
  }

  const customer = store.createCustomer(body);
  res.json({
    status: "success",
    ref2: customer.ref2,
    token: customer.token,
    project_refno: customer.project_refno,
  });
});
