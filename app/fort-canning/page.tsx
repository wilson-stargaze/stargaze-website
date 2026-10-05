import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { normalizeReferral, walkBookingUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fort Canning Heritage & Butterfly Trail",
  description: "Discover Fort Canning’s heritage and surprising biodiversity with an award-winning nature storyteller. Guided walks from S$45 per guest, including refreshments and a souvenir.",
};

export default async function FortCanning({ searchParams }: PageProps<"/fort-canning">) {
  const referral = normalizeReferral((await searchParams).ref);
  const bookingUrl = walkBookingUrl(referral);
  return (
    <main id="main-content">
      <section className="hero wrap walk-hero">
        <Link href="/#experiences" className="back-link">← All experiences</Link>
        <p className="eyebrow">Fort Canning Heritage & Butterfly Trail</p>
        <h1 className="trail-title">A hill full of history.<br /><em>A world full of life.</em></h1>
        <p className="intro">Discover the connections between Singapore’s heritage and the surprising biodiversity thriving right in the city.</p>
        <div className="actions"><Link href={bookingUrl} className="button">Request a walk ↗</Link><a href="#details" className="text-link">Walk details ↓</a></div>
        <p className="hero-note">Allow 2 hours · English · S$45 per guest</p>
        <figure className="trail-photo">
          <Image className="photo" src="/images/fort-canning/guided-walk.jpg" width={2000} height={1500} sizes="(max-width: 1168px) calc(100vw - 48px), 1120px" alt="A group of walk participants gathered on a path surrounded by greenery" />
          <figcaption>Discovering Singapore together, one story and small detail at a time.</figcaption>
        </figure>
      </section>
      <section className="section wrap split">
        <div><p className="eyebrow">The experience</p><h2>Follow the stories.<br />Notice the life around them.</h2></div>
        <div><p className="intro">Fort Canning has taken many forms: a palace, a colonial fort, and today a green refuge in the city. Explore those layers with a local nature guide, discovering how the hill’s human stories connect with its plants and wildlife.</p><p>Along the way, slow down to look for butterflies and other small wonders. You don’t need any nature knowledge to join — just a little curiosity.</p></div>
      </section>
      <section className="section band"><div className="wrap">
        <p className="eyebrow">What you’ll discover</p><h2>Heritage, with a wild side.</h2>
        <div className="cards highlights">
          <article><span className="number">01</span><h3>Life hiding in plain sight</h3><p>Look for plants, butterflies and other wildlife, and learn to spot the details that are easy to miss.</p></article>
          <article><span className="number">02</span><h3>The hill’s changing identity</h3><p>Hear stories of Fort Canning’s journey from palace to fort to a sanctuary for nature.</p></article>
          <article><span className="number">03</span><h3>Nature and people, connected</h3><p>See how Singapore’s natural and human heritage intertwine through the eyes of a local guide.</p></article>
        </div>
      </div></section>
      <section id="details" className="section wrap split">
        <div><p className="eyebrow">At a glance</p><h2>Plan your trail.</h2>
          <Image className="photo" src="/images/fort-canning/dragonfly.jpg" width={2048} height={1262} sizes="(max-width: 760px) calc(100vw - 48px), 528px" alt="A dragonfly resting on a twig among bright green leaves" />
        </div>
        <dl className="details">
          <div><dt>Duration</dt><dd>Approximately 1½–2 hours; allow 2 hours for your visit</dd></div>
          <div><dt>Start time</dt><dd>A morning start around 9.30am is ideal. Your time will be agreed when arranging the walk.</dd></div>
          <div><dt>Location</dt><dd>Fort Canning Park. The route is to be confirmed.</dd></div>
          <div><dt>Meeting point</dt><dd>To be confirmed. Meeting instructions will be shared before the walk.</dd></div>
          <div><dt>Who it’s for</dt><dd>Adults, families and curious travellers; no nature knowledge required</dd></div>
          <div><dt>Guests</dt><dd>Request places for up to 20 guests. Group arrangements will be confirmed with you.</dd></div>
          <div><dt>Language</dt><dd>English</dd></div>
          <div><dt>Price</dt><dd>S$45 per guest, including a souvenir and refreshments.</dd></div>
          <div><dt>Availability</dt><dd>Monday and Wednesday requests, subject to availability. Dates and group arrangements require confirmation.</dd></div>
          <div><dt>Bring along</dt><dd>Comfortable walking shoes, drinking water and rain protection</dd></div>
        </dl>
      </section>
      <section className="section wrap guide"><p className="eyebrow">Your guide</p><h2>Stories that help you see more.</h2><p className="intro">Explore with an award-winning nature storyteller who connects the hill’s history with the life around you. There’s room for questions, close observation and the unexpected discoveries that make each walk its own.</p></section>
      <section id="booking" className="section booking"><div className="wrap split">
        <div><p className="eyebrow">Come walk with us</p><h2>Your group.<br />A shared discovery.</h2></div>
        <div><h3>Request your walk</h3><p>Choose a Monday or Wednesday, tell us who’s joining, and select a payment preference. Stargaze will check availability before discussing payment with you or your hotel.</p>
          <p>S$45 per guest, with refreshments and a souvenir included.</p>
          <Link className="button light" href={bookingUrl}>Request a walk ↗</Link>
          <p className="small">Submitting a request does not confirm a booking. Hotel payment is subject to the hotel’s agreement.</p>
        </div>
      </div></section>
      <section className="section wrap faq"><p className="eyebrow">Good to know</p><h2>A few practical questions.</h2>
        <details><summary>Do I need to know anything about nature?</summary><p>No. Adults, families and curious travellers are welcome. Your guide will help you notice and understand what you find along the way.</p></details>
        <details><summary>What if it rains?</summary><p>The walk can continue in light rain. In a thunderstorm, it can be postponed or cancelled with a refund.</p></details>
        <details><summary>What’s included in the price?</summary><p>S$45 per guest includes the guided walk, refreshments and a souvenir.</p></details>
        <details><summary>Is the route suitable for everyone?</summary><p>Fort Canning is a hill, and the route may involve slopes or steps. Let us know about mobility needs or young children before booking so we can discuss suitability. The route is still to be confirmed.</p></details>
        <details><summary>Can I request a walk for just myself?</summary><p>Yes. You can request places for yourself or a group. Stargaze will confirm availability and the group arrangements with you before your booking is confirmed.</p></details>
      </section>
    </main>
  );
}
