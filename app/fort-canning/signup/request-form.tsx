"use client";

import { useRef, useState, type FormEvent } from "react";
import { dateLabel, requestEmail, validateRequest } from "@/lib/walk-requests";

export default function RequestForm({ referral, dates, online, email }: { referral: string; dates: string[]; online: boolean; email: string }) {
  const [payment, setPayment] = useState("");
  const [count, setCount] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const requestId = useRef("");
  const feedback = useRef<HTMLDivElement>(null);
  function showErrors(value: Record<string, string>) {
    setErrors(value);
    setTimeout(() => feedback.current?.focus(), 0);
  }
  function fieldError(name: string) { return errors[name] ? <span id={`${name}-error`} className="field-error">{errors[name]}</span> : null; }
  function invalid(name: string) { return { "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `${name}-error` : undefined }; }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = { ...Object.fromEntries(form), consent: form.get("consent") === "on", referral };
    const result = validateRequest(data, dates);
    if (!result.value) { showErrors(result.errors); return; }
    setErrors({});
    const draft = requestEmail(result.value, email);
    setEmailDraft(draft);
    if (!online) { window.location.href = draft; return; }
    if (!requestId.current) requestId.current = crypto.randomUUID();
    setBusy(true);
    try {
      const response = await fetch("/api/walk-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, requestId: requestId.current }), signal: AbortSignal.timeout(20000) });
      const saved = await response.json();
      if (!response.ok) { showErrors({ ...(saved.errors || {}), form: saved.error || "We couldn’t save your request. Please try again." }); return; }
      setReference(saved.reference);
      setTimeout(() => feedback.current?.focus(), 0);
    } catch { showErrors({ form: "We couldn’t confirm that your request was saved. Retry with the same details, or use the email option below." }); }
    finally { setBusy(false); }
  }

  if (reference) return <div className="request-success" ref={feedback} tabIndex={-1} role="status">
    <p className="eyebrow">Request received</p><h2>Thank you.<br />We’ll be in touch.</h2>
    <p>Your request has been saved. Stargaze will check availability and contact you by email. Your walk is not confirmed yet, and no payment has been taken.</p>
    <p>If you requested hotel payment, Stargaze will discuss the arrangement with your hotel after checking availability. Room charges require the hotel’s agreement.</p>
    <p className="small">Request reference: <span className="request-reference">{reference}</span></p>
    <p>No automatic confirmation email is sent yet. Keep this reference in case you need to contact us.</p>
    <a className="text-link" href={`mailto:${email}?subject=${encodeURIComponent(`Walk request ${reference}`)}`}>Contact Stargaze</a>
  </div>;

  return <form className="request-form" onSubmit={submit} onChange={() => { requestId.current = ""; setEmailDraft(""); }}>
    {!online && <div className="form-notice"><strong>Requests by email for now</strong><p>Complete the details below to prepare an email to Stargaze. Your email app will open; please send the message to submit your request. This form does not save your details online yet.</p></div>}
    {referral && <p className="small">Hotel referral code: <strong>{referral}</strong>. This records how you found us; it does not confirm a payment arrangement.</p>}
    {Object.keys(errors).length > 0 && <div className="form-errors" ref={feedback} role="alert" tabIndex={-1}><strong>{errors.form || "Please check the fields below."}</strong><ul>{Object.entries(errors).filter(([key]) => key !== "form").map(([key, message]) => <li key={key}><a href={`#${key}`}>{message}</a></li>)}</ul></div>}
    <fieldset disabled={busy}>
      <legend>Your walk</legend>
      <label htmlFor="date">Preferred date</label>
      <select id="date" name="date" required defaultValue="" {...invalid("date")}><option value="" disabled>Choose a Monday or Wednesday</option>{dates.map(date => <option key={date} value={date}>{dateLabel(date)}</option>)}</select>{fieldError("date")}
      <p className="field-hint">These are dates you can request, subject to Stargaze’s availability. The start time will be agreed separately.</p>
      <label htmlFor="guestCount">Number of guests</label><input id="guestCount" name="guestCount" type="number" min={1} max={20} required value={count} onChange={event => setCount(Number(event.target.value))} {...invalid("guestCount")} />{fieldError("guestCount")}
      <p className="field-hint">S$45 per guest. Estimated total: S${Number.isInteger(count) && count >= 1 && count <= 20 ? count * 45 : "—"}. No payment is taken here.</p>
      <label htmlFor="guestNames">Guest names</label><textarea id="guestNames" name="guestNames" rows={4} maxLength={2200} required placeholder="One guest name per line" {...invalid("guestNames")} />{fieldError("guestNames")}
      <p className="field-hint">Include yourself if you’re joining. Enter a name for each of the {count || "listed"} guests.</p>
    </fieldset>
    <fieldset disabled={busy}>
      <legend>How we can reach you</legend>
      <label htmlFor="contactName">Contact name</label><input id="contactName" name="contactName" autoComplete="name" maxLength={100} required {...invalid("contactName")} />{fieldError("contactName")}
      <label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} required {...invalid("email")} />{fieldError("email")}
    </fieldset>
    <fieldset disabled={busy}>
      <legend>Payment preference</legend>
      <label htmlFor="paymentMethod">How would you like to arrange payment?</label>
      <select id="paymentMethod" name="paymentMethod" required value={payment} onChange={event => setPayment(event.target.value)} {...invalid("paymentMethod")}>
        <option value="" disabled>Choose a preference</option><option value="hotel">Ask my hotel to arrange payment</option><option value="discuss">Discuss direct payment with Stargaze</option>
      </select>{fieldError("paymentMethod")}
      <p className="field-hint">Hotel payment and room charges depend on your hotel’s agreement. For direct payment, we’ll confirm the available methods with you before booking.</p>
      <label htmlFor="hotelName">Hotel name {payment === "hotel" ? "" : "(optional)"}</label><input id="hotelName" name="hotelName" maxLength={120} required={payment === "hotel"} {...invalid("hotelName")} />{fieldError("hotelName")}
      <label htmlFor="roomNumber">Room number (optional)</label><input id="roomNumber" name="roomNumber" maxLength={30} {...invalid("roomNumber")} />{fieldError("roomNumber")}
      <label htmlFor="notes">Questions or requests (optional)</label><textarea id="notes" name="notes" rows={3} maxLength={1000} {...invalid("notes")} />{fieldError("notes")}
    </fieldset>
    <div className="form-trap" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
    <label className="consent" htmlFor="consent"><input id="consent" name="consent" type="checkbox" required disabled={busy} {...invalid("consent")} /><span>I understand this is a request, not a confirmed booking. Stargaze may use these details to arrange my walk and, if I request hotel payment, share the necessary booking details with my hotel.</span></label>{fieldError("consent")}
    <button className="button" type="submit" disabled={busy}>{busy ? "Sending request…" : online ? "Send walk request" : "Prepare email request"}</button>
    {emailDraft && <p className="small">{online ? "Prefer email instead?" : "If your email app didn’t open,"} <a className="text-link" href={emailDraft}>open the prepared email request</a>. You must send the email yourself. It does not confirm a booking.</p>}
    <noscript><p>Please enable JavaScript to use the form, or email <a href={`mailto:${email}`}>{email}</a> with your preferred date, guest names, number of guests and payment preference.</p></noscript>
  </form>;
}
