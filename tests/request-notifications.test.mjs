import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return {url:pathToFileURL(path.join(root,`${specifier.slice(2)}.ts`)).href,shortCircuit:true};
  return nextResolve(specifier,context);
}});
const {notificationEmail, notificationWorkerAuthorized, sendPendingNotifications} = await import("../lib/request-notifications.ts");
const {POST} = await import("../app/api/request-notifications/route.ts");
const request = {date:"2026-10-07",guestCount:2,guestNames:["Guest One","Guest Two"],contactName:"Contact",email:"guest@example.com",paymentMethod:"hotel",hotelName:"YMCA Orchard",roomNumber:"123",referral:"ymca-orchard",notes:"Test",consent:true};

test("notification has a fixed owner recipient, guest reply-to and complete request details",()=>{
  const email=notificationEmail(request,"test-id","Stargaze <bookings@stargaze-solutions.com>");
  assert.deepEqual(email.to,["wilson@stargaze-solutions.com"]);
  assert.equal(email.reply_to,request.email);
  for(const text of ["Guest One","Guest Two","S$90","YMCA Orchard","123","ymca-orchard","not a confirmed booking","test-id"]) assert.ok(email.text.includes(text));
});

test("worker rejects unauthorized requests before database access",async()=>{
  const old=process.env.NOTIFICATION_WORKER_SECRET;
  try{
    delete process.env.NOTIFICATION_WORKER_SECRET;
    assert.equal(notificationWorkerAuthorized("Bearer wrong"),false);
    process.env.NOTIFICATION_WORKER_SECRET="test-worker-secret";
    assert.equal(notificationWorkerAuthorized(null),false);
    assert.equal(notificationWorkerAuthorized("Bearer wrong"),false);
    assert.equal(notificationWorkerAuthorized("Bearer test-worker-secret"),true);
    assert.equal((await POST(new Request("https://example.com/api/request-notifications",{method:"POST"}))).status,401);
  }finally{if(old===undefined) delete process.env.NOTIFICATION_WORKER_SECRET;else process.env.NOTIFICATION_WORKER_SECRET=old;}
});

test("durable email body, idempotency and failure acknowledgement survive retries",async()=>{
  const oldFetch=globalThis.fetch;
  const names=["RESEND_API_KEY","BOOKING_EMAIL_FROM","SUPABASE_URL","SUPABASE_SECRET_KEY"];
  const old=names.map(n=>process.env[n]);
  const job={request_id:"test-id",lease_token:"test-lease",request_payload:request,email_payload:null};
  let mode="success",prepared=0;
  const finishes=[];
  try{
    delete process.env.RESEND_API_KEY;
    assert.equal((await sendPendingNotifications()).configured,false);
    process.env.RESEND_API_KEY="test-resend";
    process.env.BOOKING_EMAIL_FROM="Stargaze <bookings@stargaze-solutions.com>";
    process.env.SUPABASE_URL="https://database.example";
    process.env.SUPABASE_SECRET_KEY="test-database";
    globalThis.fetch=async(url,options)=>{
      const data=JSON.parse(options.body);
      if(url.endsWith("/claim_walk_notification")) return Response.json([job]);
      if(url.endsWith("/prepare_walk_notification")) {prepared++;job.email_payload=data.email;return Response.json(true);}
      if(url.endsWith("/finish_walk_notification")){finishes.push(data);return Response.json(true);}
      assert.equal(url,"https://api.resend.com/emails");
      assert.equal(options.headers["Idempotency-Key"],"walk-request/test-id");
      assert.deepEqual(data,job.email_payload);
      if(mode==="network") throw Error("Network failure");
      if(mode==="reject") return Response.json({error:"rejected"},{status:429});
      return Response.json({id:"provider-id"});
    };
    assert.deepEqual(await sendPendingNotifications("test-id"),{configured:true,accepted:1,failed:0});
    assert.equal(finishes[0].provider_id,"provider-id");
    process.env.BOOKING_EMAIL_FROM="Changed sender";
    mode="network";
    assert.equal((await sendPendingNotifications("test-id")).failed,1);
    assert.equal(finishes[1].provider_id,null);
    mode="reject";
    await sendPendingNotifications("test-id");
    assert.equal(finishes[2].failure,"email_provider_http_429");
    assert.equal(prepared,1);
  }finally{globalThis.fetch=oldFetch;names.forEach((n,i)=>{if(old[i]===undefined)delete process.env[n];else process.env[n]=old[i];});}
});
