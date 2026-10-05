# Stargaze Solutions

Version 1 keeps the existing Next.js App Router, TypeScript and Tailwind 4 setup.

- `/`: introduction, experiences, about and contact.
- `/fort-canning`: nature and history walk, highlights, guide introduction, practical details, booking/enquiry and FAQ.
- Woodlands Botanical Garden and Corporate BioBlitz are coming-soon cards, without dead links.

## Content and booking

Edit copy in `app/page.tsx` and `app/fort-canning/page.tsx`. Shared contact and booking settings live in `lib/site.ts`.

No dates, prices, guide credentials, photographs or cancellation policies have been invented. Add confirmed details and your own photographs when ready.

Until a booking form exists, the page says bookings are opening soon and offers an email enquiry when a contact email is configured. An enquiry does not confirm a reservation.

Referral URLs such as `/fort-canning?ref=hotel-waterloo` include the referral in the enquiry email draft. Once `bookingUrl` is configured, the code passes `ref` to the HTTPS booking URL, preserving its existing parameters. Configure the destination form to accept and store that value. No analytics or referral database exists yet.

A future custom booking form will need validated submissions, durable storage or email delivery, spam protection and a confirmation process. Availability and payment should be added only when their requirements are agreed.

## Vercel diagnosis

On 5 October 2026, the existing deployment was Ready and its build log generated `/`, but its production domain returned Vercel's platform `NOT_FOUND`. The project's Build and Deployment settings showed Framework Preset **Other**. This prevents the Next.js output from being deployed with the proper framework handling.

`vercel.json` explicitly sets `framework` to `nextjs`. The next deployment should use the Next.js framework. Keep Root Directory empty because `package.json` is at the repository root; use default install/build/output settings.

The observed project domain is `stargaze-website-57wm.vercel.app`. The repository homepage field lists `stargaze-website.vercel.app`, a different address. Use the domain displayed in the Vercel dashboard. Connecting `stargaze-solutions.com` is a later domain setup step.

## Checks

Run `npm ci`, `npm run lint` and `npm run build`. Preview with `npm run start`; check both routes on desktop and mobile, including `/fort-canning?ref=hotel-waterloo`.
