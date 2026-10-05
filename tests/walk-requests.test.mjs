import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return { url: pathToFileURL(path.join(root, `${specifier.slice(2)}.ts`)).href, shortCircuit: true };
  return nextResolve(specifier, context);
} });
const { singaporeToday, requestDates, blockedDates, validateRequest, requestEmail } = await import("../lib/walk-requests.ts");
const { walkBookingUrl } = await import("../lib/site.ts");
const { POST } = await import("../app/api/walk-requests/route.ts");
const valid = () => ({ date: requestDates()[0], guestCount: 2, guestNames: "Test Guest One\nTest Guest Two", contactName: "Test Contact", email: "test@example.com", paymentMethod: "hotel", hotelName: "Test Hotel", roomNumber: "TEST", referral: "hotel-waterloo", consent: true, requestId: "b9928094-788d-4e31-98cb-25c91d07ae54" });
const req = (data, origin = "https://www.stargaze-solutions.com") => new Request("https://www.stargaze-solutions.com/api/walk-requests", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, "x-vercel-forwarded-for": "192.0.2.1" }, body: JSON.stringify(data) });

test("Singapore dates use the correct local day across UTC midnight", () => {
  assert.equal(singaporeToday(new Date("2026-10-04T17:00:00Z")), "2026-10-05");
  const dates = requestDates(new Date("2026-10-04T17:00:00Z"));
  assert.equal(dates[0], "2026-10-05");
  assert.ok(dates.every(date => [1, 3].includes(new Date(`${date}T00:00:00Z`).getUTCDay())));
  blockedDates.push("2026-10-05");
  try { assert.ok(!requestDates(new Date("2026-10-04T17:00:00Z")).includes("2026-10-05")); }
  finally { blockedDates.pop(); }
});

test("validate names, dates, count, hotel preference and acknowledgement", () => {
  assert.ok(validateRequest(valid()).value);
  assert.ok(validateRequest({ ...valid(), guestCount: 3 }).errors.guestNames);
  assert.ok(validateRequest({ ...valid(), guestCount: 0 }).errors.guestCount);
  assert.ok(validateRequest({ ...valid(), guestCount: 21 }).errors.guestCount);
  assert.ok(validateRequest({ ...valid(), date: "2026-10-06" }, ["2026-10-05"]).errors.date);
  assert.ok(validateRequest({ ...valid(), date: "2000-01-01" }).errors.date);
  assert.ok(validateRequest({ ...valid(), hotelName: "" }).errors.hotelName);
  assert.ok(validateRequest({ ...valid(), hotelName: "", paymentMethod: "discuss" }).value);
  assert.ok(validateRequest({ ...valid(), consent: false }).errors.consent);
  assert.ok(validateRequest({ ...valid(), website: "spam" }).errors.form);
  assert.ok(validateRequest({ ...valid(), email: "not-an-email" }).errors.email);
});

test("referral travels to the form and email, while invalid codes are discarded", () => {
  assert.equal(walkBookingUrl("hotel-waterloo"), "/fort-canning/signup?ref=hotel-waterloo");
  const value = validateRequest(valid()).value;
  assert.equal(value.referral, "hotel-waterloo");
  assert.match(decodeURIComponent(requestEmail(value, "wilson@stargaze-solutions.com")), /Referral: hotel-waterloo/);
  assert.equal(validateRequest({ ...valid(), referral: "hotel&fake=1" }).value.referral, null);
});

test("API rejects cross-origin, oversized and invalid submissions", async () => {
  assert.equal((await POST(req(valid(), "https://unrelated.example"))).status, 403);
  assert.equal((await POST(req({ ...valid(), notes: "x".repeat(20000) }))).status, 413);
  assert.equal((await POST(req({ ...valid(), guestNames: "" }))).status, 400);
});

test("API acknowledges only saved requests, preserves retry IDs and handles storage failure", async () => {
  const oldFetch = globalThis.fetch;
  const oldUrl = process.env.SUPABASE_URL;
  const oldSecret = process.env.SUPABASE_SECRET_KEY;
  try {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    assert.equal((await POST(req(valid()))).status, 503);
    process.env.SUPABASE_URL = "https://database.example";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_dummy_for_tests";
    const records = new Map();
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://database.example/rest/v1/rpc/submit_walk_request");
      assert.equal(options.headers.apikey, "sb_secret_dummy_for_tests");
      assert.equal(options.headers.Authorization, undefined);
      const saved = JSON.parse(options.body);
      assert.match(saved.sender_hash, /^[a-f0-9]{64}$/);
      assert.equal(saved.payload.referral, "hotel-waterloo");
      assert.equal(saved.payload.paymentMethod, "hotel");
      assert.deepEqual(saved.payload.guestNames, ["Test Guest One", "Test Guest Two"]);
      records.set(saved.payload.requestId, saved.payload);
      return Response.json(saved.payload.requestId);
    };
    const first = await POST(req(valid()));
    assert.equal(first.status, 201);
    assert.equal((await first.json()).reference, valid().requestId);
    assert.equal((await POST(req(valid()))).status, 201);
    assert.equal(records.size, 1);
    globalThis.fetch = async () => Response.json({ message: "request_rate_limit" }, { status: 400 });
    assert.equal((await POST(req(valid()))).status, 429);
    globalThis.fetch = async () => Response.json({ message: "request_id_conflict" }, { status: 400 });
    assert.equal((await POST(req(valid()))).status, 409);
    globalThis.fetch = async () => Response.json({ message: "database_unavailable" }, { status: 500 });
    assert.equal((await POST(req(valid()))).status, 503);
    globalThis.fetch = async () => { throw new Error("Network failure"); };
    assert.equal((await POST(req(valid()))).status, 503);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.SUPABASE_SECRET_KEY; else process.env.SUPABASE_SECRET_KEY = oldSecret;
  }
});
