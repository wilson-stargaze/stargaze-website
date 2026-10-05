import type { Metadata } from "next";
import Link from "next/link";
import { normalizeReferral, site, walkBookingUrl, walkEnquiryUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fort Canning Nature & History Walk",
  description: "Look closer at Fort Canning with a guided walk connecting Singapore’s plants, wildlife and history. Enquire about a walk with Stargaze Solutions.",
};

export default async function FortCanning({ searchParams }: PageProps<"/fort-canning">) {
  const referral = normalizeReferral((await searchParams).ref);
  const bookingUrl = walkBookingUrl(referral);
  return (
    <main id="main-content">
      <section className="hero wrap walk-hero">
        <Link href="/#experiences" className="back-link">← All experiences</Link>
        <p className="eyebrow">A different side of Singapore</p><h1>Fort Canning.<br /><em>Look closer.</em></h1>
        <p className="intro">A nature and history walk uncovering the wild stories hiding in the heart of the city.</p>
        <div className="actions"><a href="#booking" className="button">{bookingUrl ? "Book your walk" : "Plan your walk"} ↗</a><a href="#details" className="text-link">Walk details ↓</a></div>
        <p className="hero-note">Fort Canning Park · 1½–2 hours · Guided walk</p>
      </section>
      <section className="section wrap split">
        <div><p className="eyebrow">The experience</p><h2>There’s more to<br />this hill than meets the eye.</h2></div>
        <div><p className="intro">Explore Fort Canning through its plants, wildlife and people. Discover how nature and history have shaped this green space, from Singapore’s layered past to the living tropical landscape around us today.</p><p>No nature knowledge needed. Just bring your curiosity.</p></div>
      </section>
      <section className="section band"><div className="wrap">
        <p className="eyebrow">What you’ll discover</p><h2>Small details. Unexpected stories.</h2>
        <div className="cards highlights">
          <article><span className="number">01</span><h3>A living landscape</h3><p>Look for the plants and wildlife that share the city with us.</p></article>
          <article><span className="number">02</span><h3>Nature meets history</h3><p>Follow the connections between the hill’s natural world and its human stories.</p></article>
          <article><span className="number">03</span><h3>A new way of seeing</h3><p>Learn to notice the little things you might otherwise walk straight past.</p></article>
        </div>
      </div></section>
      <section id="details" className="section wrap split">
        <div><p className="eyebrow">At a glance</p><h2>Your walk,<br />in a little more detail.</h2></div>
        <dl className="details">
          <div><dt>Duration</dt><dd>Approximately 1½–2 hours</dd></div>
          <div><dt>Location</dt><dd>Fort Canning Park, Singapore</dd></div>
          <div><dt>Who it’s for</dt><dd>Curious travellers, locals, families and small groups</dd></div>
          <div><dt>Meeting point</dt><dd>Exact meeting point provided when your walk is confirmed</dd></div>
          <div><dt>Dates & price</dt><dd>To be announced. Enquire for availability.</dd></div>
          <div><dt>Bring along</dt><dd>Comfortable walking shoes, drinking water and rain protection</dd></div>
        </dl>
      </section>
      <section className="section wrap guide"><p className="eyebrow">Your guide</p><h2>Discover through stories.</h2><p className="intro">A Stargaze guide helps you connect what you see with the stories around it, making space for questions, observation and unexpected discoveries along the way.</p></section>
      <section id="booking" className="section booking"><div className="wrap split">
        <div><p className="eyebrow">Come walk with us</p><h2>A little curiosity.<br />A fresh perspective.</h2></div>
        <div><h3>{bookingUrl ? "Reserve your walk" : "Bookings opening soon"}</h3><p>{bookingUrl ? "View available dates and booking details using our booking form." : "Public dates and prices are being finalised. Get in touch to ask about availability or arrange a private walk for your family, friends or hotel guests."}</p>
          {bookingUrl ? <a className="button light" href={bookingUrl}>Book your walk ↗</a> : site.email ? <a className="button light" href={walkEnquiryUrl(referral)}>Enquire about a walk ↗</a> : <p>Enquiry details will be available soon.</p>}
          <p className="small">{bookingUrl ? "Your booking form will explain the confirmation and payment steps." : "An enquiry is not a confirmed reservation."}</p>
        </div>
      </div></section>
      <section className="section wrap faq"><p className="eyebrow">Good to know</p><h2>A few practical questions.</h2>
        <details><summary>Do I need to know anything about nature?</summary><p>No. The walk is designed for curious people, with space to ask questions and look closer.</p></details>
        <details><summary>What if it rains?</summary><p>Bring rain protection. Weather arrangements and cancellation terms will be confirmed before you book.</p></details>
        <details><summary>Is the route suitable for everyone?</summary><p>Fort Canning is a hill, and routes may involve slopes or steps. Let us know about mobility needs or young children before booking so we can discuss a suitable route.</p></details>
        <details><summary>Can I arrange a private walk?</summary><p>Yes, enquire about a walk for your group. We’ll discuss dates, group size and pricing with you.</p></details>
      </section>
    </main>
  );
}
