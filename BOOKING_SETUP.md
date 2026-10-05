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

Use Supabase Table Editor → `walk_requests` to review requests. Check availability, then manually contact the guest and hotel as agreed. Change `status` through `requested`, `availability_confirmed`, `hotel_contacted`, `confirmed`, or `cancelled`. Payment starts as `not_arranged`; update it manually through `hotel_arranging`, `arranged`, or `paid`. Only use `confirmed` when the booking and payment arrangement are agreed. No hotel or guest emails are sent automatically. Check new requests regularly; email alerts can be added later.

Filter/group `referral_code` to compare enquiries and confirmed bookings. No visitor analytics are implemented, so this reports submitted requests, not visit-to-submission conversion. Hotel codes can be distributed as URLs/QR codes without creating separate forms. Guest-entered hotel names remain separate from URL attribution.

## Protection and verification

The guest cannot read the database. Row Level Security is enabled with no public read/write policies. The secret stays on the server. The API validates every field, bounds request size, rejects cross-origin requests and honeypot submissions, and uses a keyed hash rather than storing raw IP addresses. The database limits new submissions to five per hashed source per hour. Shared hotel networks may hit this limit; visitors can email instead. Request IDs prevent retries from creating duplicate rows. Keep the Supabase dashboard access restricted to staff who need guest details, and choose a retention period for completed requests.

Run `npm run lint`, `npm run build`, and `node --test tests/walk-requests.test.mjs`. Once configured, use an explicitly marked test request to verify save, retry behaviour, referral capture and hotel-payment preference. Check that anonymous database reads are denied. Remove test records only after identifying them as disposable test data.

The SQL migration was executed successfully. A transactional database test verified referral capture and the initial request/payment statuses, then rolled back its test row. Local mock tests also verify application handling.

Live verification on 5 October 2026: the custom-domain form returned a saved request reference after submitting a clearly marked test request. Anonymous SELECT and function EXECUTE permissions are denied. One `TEST ONLY` request with referral `test-hotel` remains in the table for verification; disregard it when counting real enquiries.
