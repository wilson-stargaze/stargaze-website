import type { Metadata } from "next";
import Link from "next/link";
import { normalizeReferral, site } from "@/lib/site";
import { requestDates } from "@/lib/walk-requests";
import RequestForm from "./request-form";

export const metadata: Metadata = { title: "Request a Fort Canning walk", description: "Request a Monday or Wednesday Fort Canning Heritage & Butterfly Trail. Availability and payment arrangements are confirmed separately." };

export default async function Signup({ searchParams }: PageProps<"/fort-canning/signup">) {
  const referral = normalizeReferral((await searchParams).ref);
  const back = referral ? `/fort-canning?ref=${encodeURIComponent(referral)}` : "/fort-canning";
  return <main id="main-content" className="wrap signup-page">
    <Link className="back-link" href={back}>← Back to the trail</Link>
    <p className="eyebrow">Fort Canning Heritage & Butterfly Trail</p>
    <h1 className="form-title">Let’s plan<br /><em>your walk.</em></h1>
    <p className="intro">Choose a Monday or Wednesday and tell us who’s joining. We’ll check availability, then agree the payment arrangement with you or your hotel.</p>
    <p>S$45 per guest · Allow 2 hours · Meeting point to be confirmed</p>
    <RequestForm referral={referral || ""} dates={requestDates()} online={Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY)} email={site.email} />
  </main>;
}
