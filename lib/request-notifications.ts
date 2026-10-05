import { timingSafeEqual } from "node:crypto";
import { dateLabel, type WalkRequest } from "@/lib/walk-requests";

const recipient = "wilson@stargaze-solutions.com";
type Job = { request_id: string; lease_token: string; request_payload: WalkRequest; email_payload: Record<string, unknown> | null };

export function notificationEmail(request: WalkRequest, id: string, from: string) {
  return {
    from, to: [recipient], reply_to: request.email,
    subject: `New Fort Canning request — ${request.date} — ${request.guestCount} guest${request.guestCount === 1 ? "" : "s"}`,
    text: [
      "A new walk request needs your availability check. This is not a confirmed booking.",
      `Reference: ${id}`, `Preferred date: ${dateLabel(request.date)}`,
      `Guests: ${request.guestCount}`, ...request.guestNames.map(name => `- ${name}`),
      `Estimated total: S$${request.guestCount * 45}`, "",
      `Contact: ${request.contactName}`, `Email: ${request.email}`,
      `Payment preference: ${request.paymentMethod === "hotel" ? "Ask hotel to arrange payment" : "Discuss direct payment"}`,
      `Hotel: ${request.hotelName || "Not supplied"}`, `Room: ${request.roomNumber || "Not supplied"}`,
      `Referral: ${request.referral || "No referral code"}`, `Notes: ${request.notes || "None"}`, "",
      "Check availability, contact the guest, then contact their hotel if hotel payment was requested. No charge has been taken.",
      "Review requests: https://supabase.com/dashboard/project/xofsmbtelfjgnzgezgno/editor/17603?schema=public",
    ].join("\n"),
  };
}

async function rpc(name: string, body: Record<string, unknown>) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("notification_database_unconfigured");
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${name}`, {
    method: "POST", headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("notification_database_error");
  return response.json();
}

export function notificationWorkerAuthorized(header: string | null) {
  const secret = process.env.NOTIFICATION_WORKER_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// SQL leases serialize workers; persisted email bodies and provider idempotency
// protect against retries after a timeout or a failed acknowledgement.
export async function sendPendingNotifications(requestId: string | null = null) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_EMAIL_FROM;
  if (!key || !from) return { configured: false, accepted: 0, failed: 0 };
  let accepted = 0;
  let failed = 0;
  for (let index = 0; index < (requestId ? 1 : 3); index++) {
    const jobs: Job[] = await rpc("claim_walk_notification", { target_request: requestId });
    const job = jobs[0];
    if (!job) break;
    let providerId: string | null = null;
    let failure: string | null = null;
    try {
      const email = job.email_payload || notificationEmail(job.request_payload, job.request_id, from);
      if (!job.email_payload) {
        const stored = await rpc("prepare_walk_notification", { target_request: job.request_id, token: job.lease_token, email });
        if (stored !== true) throw new Error("lease_lost");
      }
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `walk-request/${job.request_id}` },
        body: JSON.stringify(email), signal: AbortSignal.timeout(10000), cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.id !== "string") failure = `email_provider_http_${response.status}`;
      else providerId = result.id;
    } catch { failure = "email_send_or_prepare_failed"; }
    await rpc("finish_walk_notification", { target_request: job.request_id, token: job.lease_token, provider_id: providerId, failure });
    if (providerId) accepted++; else failed++;
  }
  return { configured: true, accepted, failed };
}
