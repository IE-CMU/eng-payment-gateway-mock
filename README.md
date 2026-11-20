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

## Testing with Postman

For each request, set Body → **raw** → **JSON**. Run the steps in order, and copy `ref2` from the step 1 response into the later requests.

### Step 1: Register customer

`POST http://localhost:4000/api/customer/create.php`

```json
{
  "project_token": "test-project-token",
  "taxpayer": "123456789",
  "cost": 10.00,
  "cust_name": "สมชาย ใจดี",
  "cust_phone": "0812345678",
  "cust_email": "somchai@example.com",
  "cust_department": "ภาควิชาวิศวกรรมคอมพิวเตอร์",
  "cust_name2": "คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเชียงใหม่",
  "cust_address": "239 ถ.ห้วยแก้ว ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200"
}
```

Response:

```json
{
  "status": "success",
  "ref2": "6900548489",
  "token": "53014663119a38dd42748f569a5a5f30",
  "project_refno": "PRJ000001"
}
```

### Step 2: Create QR payment

`POST http://localhost:4000/api/payment/create`

```json
{
  "apptoken": "test-apptoken",
  "ref1": "06010125691000004",
  "ref2": "6900548489",
  "amount": 10.00,
  "expiryDate": "2027-08-05 12:26:30",
  "numberOfTimes": 1
}
```

**`expiryDate` format:** `YYYY-MM-DD HH:mm:ss`, which is PHP's `date("Y-m-d H:i:s")`.
- Separate the date and time with a **space**, not `T`.
- Do not add a timezone suffix (`Z` or `+07:00`). The value is read as Thailand time (UTC+7).
- Hours use the 24-hour clock, and every part has 2 digits (`2027-08-05 09:05:00`, not `2027-8-5 9:5:0`).
- The value must be in the future.

| Example | Valid? |
|---|---|
| `2027-08-05 12:26:30` | ✅ |
| `2027-08-05T12:26:30` | ❌ uses `T` |
| `2027-08-05 12:26:30+07:00` | ❌ has a timezone |
| `2027-08-05` | ❌ no time |
| `05/08/2027 12:26:30` | ❌ wrong order |

To avoid editing the date by hand, add this **Pre-request Script** to the request. It sets the expiry to 2 minutes from now in Thailand time:

```js
const minutes = 2; // or 45 * 24 * 60 for 45 days
const d = new Date(Date.now() + minutes * 60_000 + 7 * 3_600_000); // shift to UTC+7
pm.variables.set("expiryDate", d.toISOString().slice(0, 19).replace("T", " "));
```

Then use `"expiryDate": "{{expiryDate}}"` in the body.

Response:

```json
{
  "status": "success",
  "ref1": "06010125691000004",
  "ref2": "6900548489",
  "amount": 10,
  "qrImage": "iVBORw0KGgoAAAANSUhEUgAAASwAAA...",
  "expire_at": "2027-08-05 12:26:30"
}
```

To view the QR, open `http://localhost:4000/payment/qr?ref2=6900548489` in a browser.

### Step 3: Check status

`GET http://localhost:4000/api/payment/status?ref2=6900548489` (no body)

```json
{
  "status": "success",
  "payment_status": "PENDING",
  "ref1": "06010125691000004",
  "ref2": "6900548489",
  "amount": "10.00",
  "expire_at": "2027-08-05 12:26:30",
  "paid_at": null
}
```

### Simulate payment, then check status again

`POST http://localhost:4000/mock/pay`

```json
{ "ref2": "6900548489" }
```

Running step 3 again now returns `"payment_status": "PAID"` and a `paid_at` value such as `"2027-08-01 10:15:42"`.

### Auto-fill `ref2` (optional)

Add this to the step 1 request's **Post-response** script (called **Tests** in older Postman versions):

```js
pm.collectionVariables.set("ref2", pm.response.json().ref2);
```

Then use `{{ref2}}` in steps 2 and 3 and in `/mock/pay`.

## Test-control endpoints (mock only)

| Endpoint | Effect |
|---|---|
| `POST /mock/pay?ref2=` | Mark `PAID`, set `paid_at` |
| `POST /mock/expire?ref2=` | Force `EXPIRED` |
| `POST /mock/reset` | Clear all data |
| `GET /mock/payments` | Dump stored customers and payments |
| `GET /health` | Health check |

`ref2` can also be sent in the request body. All data is in memory and is lost on restart.
