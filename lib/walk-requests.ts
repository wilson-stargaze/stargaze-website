export const blockedDates: string[] = [];
export const MAX_GUESTS = 20;

export function singaporeToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function requestDates(now = new Date()) {
  const start = new Date(`${singaporeToday(now)}T00:00:00Z`);
  const dates: string[] = [];
  for (let i = 0; i < 90; i++) {
    const date = new Date(start.getTime() + i * 86400000);
    const value = date.toISOString().slice(0, 10);
    if ([1, 3].includes(date.getUTCDay()) && !blockedDates.includes(value)) dates.push(value);
  }
  return dates;
}

export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-SG", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00Z`));
}

export type WalkRequest = {
  date: string;
  guestCount: number;
  guestNames: string[];
  contactName: string;
  email: string;
  paymentMethod: "hotel" | "discuss";
  hotelName: string;
  roomNumber: string;
  referral: string | null;
  notes: string;
  consent: true;
};

export function validateRequest(input: unknown, dates = requestDates()): { value?: WalkRequest; errors: Record<string, string> } {
  const data = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const text = (key: string) => typeof data[key] === "string" ? (data[key] as string).trim() : "";
  const errors: Record<string, string> = {};
  const date = text("date");
  if (!dates.includes(date)) errors.date = "Choose an upcoming Monday or Wednesday from the list.";
  const guestCount = typeof data.guestCount === "number" ? data.guestCount : Number(text("guestCount"));
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > MAX_GUESTS) errors.guestCount = "Choose between 1 and 20 guests.";
  const guestNames = text("guestNames").split(/\r?\n/).map(name => name.trim()).filter(Boolean);
  if (guestNames.length !== guestCount || guestNames.some(name => name.length > 100)) errors.guestNames = "Enter one name per line, with a name for every guest (up to 100 characters each).";
  const contactName = text("contactName");
  if (!contactName || contactName.length > 100) errors.contactName = "Enter a contact name of up to 100 characters.";
  const email = text("email");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address so we can contact you.";
  const paymentMethod = text("paymentMethod");
  if (!["hotel", "discuss"].includes(paymentMethod)) errors.paymentMethod = "Choose a payment preference.";
  const hotelName = text("hotelName");
  if ((paymentMethod === "hotel" && !hotelName) || hotelName.length > 120) errors.hotelName = "Enter your hotel name (up to 120 characters).";
  const roomNumber = text("roomNumber");
  if (roomNumber.length > 30) errors.roomNumber = "Use up to 30 characters for your room number.";
  const notes = text("notes");
  if (notes.length > 1000) errors.notes = "Keep notes to 1,000 characters.";
  if (data.consent !== true) errors.consent = "Please acknowledge how your request details will be used.";
  if (text("website")) errors.form = "We couldn’t accept this request. Please email Stargaze instead.";
  const ref = text("referral");
  const referral = /^[a-zA-Z0-9_-]{1,80}$/.test(ref) ? ref : null;
  if (Object.keys(errors).length) return { errors };
  return { errors, value: { date, guestCount, guestNames, contactName, email, paymentMethod: paymentMethod as WalkRequest["paymentMethod"], hotelName, roomNumber, referral, notes, consent: true } };
}

export function requestEmail(value: WalkRequest, email: string) {
  const body = ["Hello Stargaze, I would like to request the Fort Canning Heritage & Butterfly Trail.", "", `Preferred date: ${dateLabel(value.date)}`, `Guests: ${value.guestCount}`, ...value.guestNames.map(name => `- ${name}`), "", `Contact: ${value.contactName}`, `Email: ${value.email}`, `Payment preference: ${value.paymentMethod === "hotel" ? "Ask my hotel to arrange payment" : "Discuss direct payment with Stargaze"}`, `Hotel: ${value.hotelName || "Not supplied"}`, `Room: ${value.roomNumber || "Not supplied"}`, `Referral: ${value.referral || "Not recorded"}`, `Notes: ${value.notes || "None"}`, "", "I understand this is a request, not a confirmed booking. I agree to the use of these details to arrange my walk and, if I request hotel payment, share the necessary booking details with my hotel."].join("\n");
  return `mailto:${email}?subject=${encodeURIComponent("Fort Canning walk request")}&body=${encodeURIComponent(body)}`;
}
