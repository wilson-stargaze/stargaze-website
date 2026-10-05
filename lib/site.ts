// External booking URL can optionally replace the local request form later.
export const site = {
  email: "wilson@stargaze-solutions.com",
  bookingUrl: "",
  woodlandsBookingUrl: "https://www.seeksophie.com/experiences/explore-singapore-s-biodiversity-at-woodlands-botanical-gardens",
};

export function normalizeReferral(value: string | string[] | undefined) {
  const referral = Array.isArray(value) ? value[0] : value;
  return referral && /^[a-zA-Z0-9_-]{1,80}$/.test(referral) ? referral : undefined;
}

export function walkEnquiryUrl(referral?: string) {
  const body = [
    "Hello Stargaze, I would like to enquire about the Fort Canning Heritage & Butterfly Trail.",
    "", "Preferred date:", "Number of guests:", "Questions:",
    ...(referral ? ["", `Referral: ${referral}`] : []),
  ].join("\n");
  return `mailto:${site.email}?subject=${encodeURIComponent("Fort Canning walk enquiry")}&body=${encodeURIComponent(body)}`;
}

export function walkBookingUrl(referral?: string) {
  if (!site.bookingUrl) return `/fort-canning/signup${referral ? `?ref=${encodeURIComponent(referral)}` : ""}`;
  const url = new URL(site.bookingUrl);
  if (url.protocol !== "https:") throw new Error("Booking URL must use HTTPS");
  if (referral) url.searchParams.set("ref", referral);
  return url.toString();
}

