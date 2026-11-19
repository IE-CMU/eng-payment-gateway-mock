import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

/** Error responses are not documented in the spec; the mock uses { status: "error", message }. */
export class ApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ status: "error", message: `Not found: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.httpStatus).json({ status: "error", message: err.message });
    return;
  }
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    res.status(400).json({ status: "error", message });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ status: "error", message: "Malformed request body" });
    return;
  }
  console.error(err);
  res.status(500).json({ status: "error", message: "Internal server error" });
};
