# ENG Payment Gateway Mock

Local mock of the **CMU Engineering Payment API (V2)** (`spec/API_Payment_V2_Engineering_CMU_Guide.pdf`) for development and testing. No real money is involved.

## Run

```sh
pnpm install
cp .env.example .env   # optional
pnpm dev               # watch mode (tsx)
# or
pnpm build && pnpm start
```

Default port: `4000`. Point **both** real hosts at the mock:

| Real base URL | Mock |
|---|---|
| `https://payment.eng.cmu.ac.th` | `http://localhost:4000` |
| `https://payapi.eng.cmu.ac.th`  | `http://localhost:4000` |

## Test credentials

| Param | Default | Env var |
|---|---|---|
| `project_token` | `test-project-token` | `MOCK_PROJECT_TOKEN` |
| `apptoken` | `test-apptoken` | `MOCK_APPTOKEN` |
| `ref1` | `06010125691000004` | `MOCK_REF1` |

## API (as in the spec)

Request bodies may be JSON or `application/x-www-form-urlencoded`.

| Step | Endpoint | Notes |
|---|---|---|
| 1 | `POST /api/customer/create.php` | Returns `{ status, ref2, token, project_refno }`. `ref2` is 10 digits. |
| 2 | `POST /api/payment/create` | `amount` must equal the `cost` from step 1. `expiryDate` is `YYYY-MM-DD HH:mm:ss` (Asia/Bangkok) and must be in the future. Calling again for an unpaid `ref2` regenerates the QR. |
| 3 | `GET /api/payment/status?ref2=` | `payment_status`: `PENDING`, `PAID`, `EXPIRED` |
| – | `GET /payment/qr?ref2=` | Hosted page with QR and a **Simulate payment** button |

`qrImage` is a raw base64 PNG (no `data:` prefix) that encodes the hosted page URL. Scan it with a phone to open the page and pay. For that to work from a phone, set `PUBLIC_BASE_URL` to your LAN IP.

As in the spec examples, `amount` is a **number** in the create response and a **string** (`"10.00"`) in the status response.

### Errors (not specified in the spec; mock convention)

`{ "status": "error", "message": "..." }` with HTTP status `400` (validation, amount mismatch, bad expiry), `401` (bad token/ref1), `404` (unknown `ref2`), and `409` (already paid).

## Test-control endpoints (mock only)

| Endpoint | Effect |
|---|---|
| `POST /mock/pay?ref2=` | Mark `PAID`, set `paid_at` |
| `POST /mock/expire?ref2=` | Force `EXPIRED` |
| `POST /mock/reset` | Clear all data |
| `GET /mock/payments` | Dump stored customers and payments |
| `GET /health` | Health check |

`ref2` can also be sent in the request body. All data is in memory and is lost on restart.
