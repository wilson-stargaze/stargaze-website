# Enable saved walk requests

Configured on 5 October 2026: the migration is applied to the Supabase project and the two server variables are saved for Production in Vercel project `stargaze-website-57wm`, which serves the custom domain. The other `stargaze-website` Vercel project is a separate deployment and has no database credentials.

The form is `/fort-canning/signup`. A hotel link such as `/fort-canning?ref=hotel-waterloo` carries the same `ref` into its request-form links and into the submission. Referral codes indicate attribution, not a verified hotel payment agreement.

## Supabase

Project: `https://xofsmbtelfjgnzgezgno.supabase.co`.

1. Open the project's SQL Editor.
2. Run `supabase/migrations/202610050001_walk_requests.sql` once.
3. Under project settings → API Keys, create/copy a server **secret API key** beginning `sb_secret_`. Do not put it in GitHub or chat. This implementation uses the new secret key in the `apikey` header, not a browser publishable key.

## Vercel

In the project serving `www.stargaze-solutions.com`, open Settings → Environment Variables. Add:

- `SUPABASE_URL`: `https://xofsmbtelfjgnzgezgno.supabase.co`
- `SUPABASE_SECRET_KEY`: the server secret API key.

Apply to Production and redeploy. Use a separate test Supabase project for Preview environments if enabling saved submissions there. Never enable a public preview's write access to production guest records for testing.

Until both variables exist, the form prepares an email request. It opens the visitor's email app and explicitly tells them they must send the email themselves. It does not claim to save a request. With the connection enabled, it saves through a server route and shows a request reference only after the database acknowledges the save. A missing table or failed connection returns a clear error and preserves the entered details.

## What guests provide

An upcoming Monday/Wednesday date (within 90 days), number of guests (1–20), one name per guest, contact name/email, payment preference, hotel name when requesting hotel payment, optional room number and notes, and acknowledgement of the request-data use. Dates follow Singapore time. Block individual dates in `lib/walk-requests.ts` before deploying an update. Dates are requests, not guaranteed slots; group arrangements remain manual. The form does not take payment or promise that a hotel accepts room charges.

## Handling a request

Use Supabase Table Editor → `walk_requests` to review requests. Check availability, then manually contact the guest and hotel as agreed. Change `status` through `requested`, `availability_confirmed`, `hotel_contacted`, `confirmed`, or `cancelled`. Payment starts as `not_arranged`; update it manually through `hotel_arranging`, `arranged`, or `paid`. Only use `confirmed` when the booking and payment arrangement are agreed. No hotel or guest emails are sent automatically. Owner email alerts require the setup below; until delivery is tested, continue checking the dashboard.

Filter/group `referral_code` to compare enquiries and confirmed bookings. No visitor analytics are implemented, so this reports submitted requests, not visit-to-submission conversion. Hotel codes can be distributed as URLs/QR codes without creating separate forms. Guest-entered hotel names remain separate from URL attribution.

## Protection and verification

The guest cannot read the database. Row Level Security is enabled with no public read/write policies. The secret stays on the server. The API validates every field, bounds request size, rejects cross-origin requests and honeypot submissions, and uses a keyed hash rather than storing raw IP addresses. The database limits new submissions to five per hashed source per hour. Shared hotel networks may hit this limit; visitors can email instead. Request IDs prevent retries from creating duplicate rows. Keep the Supabase dashboard access restricted to staff who need guest details, and choose a retention period for completed requests.

Run `npm run lint`, `npm run build`, and `node --test tests/walk-requests.test.mjs`. Once configured, use an explicitly marked test request to verify save, retry behaviour, referral capture and hotel-payment preference. Check that anonymous database reads are denied. Remove test records only after identifying them as disposable test data.

The SQL migration was executed successfully. A transactional database test verified referral capture and the initial request/payment statuses, then rolled back its test row. Local mock tests also verify application handling.

Live verification on 5 October 2026: the custom-domain form returned a saved request reference after submitting a clearly marked test request. Anonymous SELECT and function EXECUTE permissions are denied. One `TEST ONLY` request with referral `test-hotel` remains in the table for verification; disregard it when counting real enquiries.

## Owner email alerts (live)

Verified live on 5 October 2026: the sending domain is verified, and a new form submission (reference `318d5a25-ae6d-4a05-9da0-796027b73d95`) produced Resend email `01a10ca5-47a0-7843-ae31-77f5291fda24` to the owner. Wilson confirmed receiving both test emails in the inbox. The notification migration's lease, stale-token rejection, completion and anonymous-read checks passed in a rolled-back Supabase test. The minute Cron job is active and its three latest runs succeeded. Matching worker tokens are stored in Vercel Production and Supabase Vault; the sending key and sender address are configured. Clearly marked test requests remain and should be excluded from real enquiry counts.

Run `supabase/migrations/202610050002_walk_notifications.sql` once. Every newly inserted request is atomically queued; an unchanged guest retry cannot create another notification. Existing requests are not backfilled automatically—review them manually before activating alerts.

Create a Resend account, verify the sending domain using the DNS records Resend supplies, and create a Sending-access API key. In Vercel project `stargaze-website-57wm`, Production, configure:

- `RESEND_API_KEY`: private sending API key, Secret type.
- `BOOKING_EMAIL_FROM`: `Stargaze Bookings <bookings@stargaze-solutions.com>` after verifying that domain. No mailbox at that address is required just to send; receiving replies is handled by the guest's Reply-To address.
- `NOTIFICATION_WORKER_SECRET`: a private random token, also saved in Supabase Vault as `stargaze_notification_worker_secret`.

Run `supabase/notification-cron.sql` once and deploy. The application attempts delivery immediately after saving; Supabase Cron checks due notifications every minute independently of visitor traffic. Do not use Vercel Hobby's daily cron for this requirement. The recipient is fixed in server code to `wilson@stargaze-solutions.com`. Messages contain the request reference, date, guest names/count, contact details, hotel/room, payment preference and referral. Guest data is sent through Resend to deliver the requested owner notification. No messages are sent to guests or hotels automatically.

The queue stores a stable email body and uses the request UUID as Resend's idempotency key. Failures retry after 1, 2, 4, 8 minutes, up to hourly. Expired worker leases recover after two minutes. Automatic retries stop after 23 hours from the first attempt to stay inside Resend's 24-hour deduplication window: inspect `needs_review` rows manually. `accepted` means Resend accepted the email, not proof of inbox delivery. Inspect Resend for delivery/bounce status and verify the inbox/spam folder in a real end-to-end test before relying on alerts. Email cannot guarantee instant inbox delivery.

Test a new explicitly marked request, verify the queue's provider ID and inbox arrival, and exercise the retry worker. Run `node --test tests/walk-requests.test.mjs tests/request-notifications.test.mjs`. Credentials, queue migration and Cron setup must all be live; passing local tests alone does not activate alerts.
