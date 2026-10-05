import { createHmac } from "node:crypto";
import { validateRequest } from "@/lib/walk-requests";

export const runtime = "nodejs";
const json = (body: unknown, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Please submit from the Stargaze website." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "Invalid request format." }, 415);
  // Bound the body even when the sender omits Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return json({ error: "Missing request." }, 400);
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 16384) { await reader.cancel(); return json({ error: "Request is too large." }, 413); }
    chunks.push(value);
  }
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return json({ error: "Invalid request format." }, 400); }
  const result = validateRequest(data);
  if (!result.value) return json({ error: "Please check the highlighted fields.", errors: result.errors }, 400);
  const requestId = typeof data.requestId === "string" ? data.requestId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return json({ error: "Please reload the form and try again." }, 400);
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return json({ error: "Online submissions are not available yet. Please use the email request option." }, 503);
  const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const senderHash = createHmac("sha256", secret).update(ip).digest("hex");
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/submit_walk_request`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: secret },
      body: JSON.stringify({ payload: { ...result.value, requestId }, sender_hash: senderHash }),
      signal: AbortSignal.timeout(10000), cache: "no-store",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (error.message === "request_rate_limit") return json({ error: "Too many requests. Please wait an hour or contact Stargaze by email." }, 429);
      if (error.message === "request_id_conflict") return json({ error: "This request has changed. Reload the form before sending a new request." }, 409);
      return json({ error: "Your request could not be saved. Please try again or use the email option." }, 503);
    }
    const savedId = await response.json();
    if (savedId !== requestId) throw new Error("Unexpected save response");
    return json({ reference: requestId }, 201);
  } catch {
    return json({ error: "We couldn’t confirm that your request was saved. Retry with the same details, or contact Stargaze by email." }, 503);
  }
}
