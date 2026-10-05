# Stargaze Solutions

Version 1 keeps the existing Next.js App Router, TypeScript and Tailwind 4 setup.

- `/`: introduction, experiences, about and contact.
- `/fort-canning`: Heritage & Butterfly Trail, brochure photographs, highlights, guide introduction, practical details, private-walk enquiry and FAQ.
- `/woodlands`: Woodlands Botanical Garden introduction and booking links to the supplied Seek Sophie listing.
- Corporate BioBlitz remains a coming-soon card, without a dead link.

## Content and booking

Edit copy in `app/page.tsx`, `app/fort-canning/page.tsx` and `app/woodlands/page.tsx`. Shared contact and booking settings live in `lib/site.ts`.

Fort Canning content follows the supplied two-page “Fort Canning Heritage & Butterfly Trail” brochure, with wording adapted for the web. The group photograph and dragonfly photograph were extracted from that PDF into `public/images/fort-canning/`.

The brochure specifies approximately 1½–2 hours (allow 2 hours), a morning start around 9.30am as ideal rather than a fixed schedule, English, groups of 3–20 and S$45 per guest including a souvenir and refreshments. Groups under five have a minimum booking charge of S$200. Following the owner's update, the meeting point and route remain to be confirmed while reconnaissance continues. Meeting instructions will be shared before the walk. Walks can continue in light rain; in a thunderstorm they can be postponed or cancelled with a refund.

Until a booking form exists, private walks are arranged by email enquiry. An enquiry does not confirm a reservation. Join-in dates are still being planned.

Woodlands bookings use `woodlandsBookingUrl`. Current prices, availability and terms remain on Seek Sophie to avoid duplicating information that can change.

Referral URLs such as `/fort-canning?ref=hotel-waterloo` include the referral in the enquiry email draft. Once `bookingUrl` is configured, the code passes `ref` to the HTTPS booking URL, preserving its existing parameters. Configure the destination form to accept and store that value. No analytics or referral database exists yet.

A future custom booking form will need validated submissions, durable storage or email delivery, spam protection and a confirmation process. Availability and payment should be added only when their requirements are agreed.

## Vercel diagnosis

On 5 October 2026, the existing deployment was Ready and its build log generated `/`, but its production domain returned Vercel's platform `NOT_FOUND`. The project's Build and Deployment settings showed Framework Preset **Other**. This prevents the Next.js output from being deployed with the proper framework handling.

`vercel.json` explicitly sets `framework` to `nextjs`. The next deployment should use the Next.js framework. Keep Root Directory empty because `package.json` is at the repository root; use default install/build/output settings.

The observed project domain is `stargaze-website-57wm.vercel.app`. The repository homepage field lists `stargaze-website.vercel.app`, a different address. Use the domain displayed in the Vercel dashboard. Connecting `stargaze-solutions.com` is a later domain setup step.

## Checks

Run `npm ci`, `npm run lint` and `npm run build`. Preview with `npm run start`; check all three routes on desktop and mobile, including `/fort-canning?ref=hotel-waterloo`, the brochure photographs and the Woodlands booking link.
