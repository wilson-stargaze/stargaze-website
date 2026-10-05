import { notificationWorkerAuthorized, sendPendingNotifications } from "@/lib/request-notifications";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!notificationWorkerAuthorized(request.headers.get("authorization"))) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  try {
    const result = await sendPendingNotifications();
    return Response.json(result, { status: result.configured ? 200 : 503, headers });
  } catch {
    console.error("walk_notification_worker_failed");
    return Response.json({ error: "Notification processing failed" }, { status: 503, headers });
  }
}
