import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Woodlands Botanical Garden Walk",
  description: "Discover a community-created garden in northern Singapore. Explore biodiversity and the stories behind Woodlands Botanical Garden, with bookings through Seek Sophie.",
};

export default function Woodlands() {
  return (
    <main id="main-content">
      <section className="hero wrap walk-hero">
        <Link href="/#experiences" className="back-link">← All experiences</Link>
        <p className="eyebrow">Community · Nature · Discovery</p>
        <h1>Woodlands.<br /><em>Wild by nature.</em></h1>
        <p className="intro">Step into a community-created botanical garden and discover a different side of Singapore.</p>
        <a className="button" href={site.woodlandsBookingUrl}>View & book on Seek Sophie ↗</a>
        <p className="hero-note">Woodlands Botanical Garden · Northern Singapore</p>
      </section>
      <section className="section band"><div className="wrap split">
        <div><p className="eyebrow">The garden walk</p><h2>What happens when<br />a community makes room for nature?</h2></div>
        <p className="intro">Explore a volunteer-run garden with a local guide. Look closer at the plants and wildlife around you, and hear how the community has helped this corner of Woodlands become a place for biodiversity to flourish.</p>
      </div></section>
      <section className="section wrap contact">
        <p className="eyebrow">Plan your visit</p><h2>Ready to explore?</h2>
        <p>Find current availability, prices, meeting details and booking terms on Seek Sophie.</p>
        <a className="button" href={site.woodlandsBookingUrl}>Book the Woodlands garden walk ↗</a>
        <p className="small">You’ll continue to Seek Sophie to make your booking.</p>
      </section>
    </main>
  );
}
