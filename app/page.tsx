import Link from "next/link";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero wrap">
        <p className="eyebrow">Nature · Stories · Discovery</p>
        <h1>See Singapore<br /><em>differently.</em></h1>
        <p className="intro">Slow down. Look closer. Discover the nature and stories hiding in plain sight.</p>
        <Link className="button" href="/fort-canning">Explore the Fort Canning walk ↗</Link>
        <p className="hero-note">Guided experiences by Stargaze Solutions</p>
      </section>
      <section id="experiences" className="section wrap">
        <p className="eyebrow">Explore with us</p><h2>A fresh perspective on familiar places.</h2>
        <div className="cards">
          <Link href="/fort-canning" className="card featured">
            <p className="eyebrow">Nature & history</p><h3>Fort Canning<br />Nature & History Walk</h3>
            <p>A green hill, a layered past, and a world of small discoveries in the heart of the city.</p>
            <span className="card-link">Discover the walk ↗</span>
          </Link>
          <article className="card"><p className="eyebrow">Coming soon</p><h3>Woodlands<br />Botanical Garden</h3><p>Explore a community-created garden and the living stories of northern Singapore.</p></article>
          <article className="card"><p className="eyebrow">Coming soon</p><h3>Corporate<br />BioBlitz</h3><p>Bring your team together through nature discovery and citizen science.</p></article>
        </div>
      </section>
      <section id="about" className="section band"><div className="wrap split">
        <div><p className="eyebrow">About Stargaze</p><h2>Curiosity is<br />a good place to start.</h2></div>
        <p className="intro">Stargaze Solutions brings people closer to Singapore through guided walks, nature experiences and citizen science. We connect the plants, wildlife and people around us with the stories that make a place its own.</p>
      </div></section>
      <section id="contact" className="section wrap contact">
        <p className="eyebrow">Let’s explore</p><h2>Something in mind?</h2><p>Get in touch about a private walk, a group experience or a hotel partnership.</p>
        {site.email ? <a className="button" href={`mailto:${site.email}`}>Email Stargaze ↗</a> : <p>Contact details will be available soon.</p>}
      </section>
    </main>
  );
}
