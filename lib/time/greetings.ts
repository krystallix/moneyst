// lib/time/greeting.ts
export type GreetingKey =
    | "good_morning"
    | "good_afternoon"
    | "good_evening"
    | "good_night";

export function getGreetingFromTimezone(opts: {
    timezone: string; // IANA, contoh "Asia/Jakarta"
    locale?: string;  // optional
}): GreetingKey {
    const { timezone, locale = "en-US" } = opts;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        hour12: false,
        timeZone: timezone,
    });

    const parts = formatter.formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour");
    const hour = hourPart ? Number(hourPart.value) : now.getUTCHours();

    if (hour >= 5 && hour < 12) return "good_morning";
    if (hour >= 12 && hour < 17) return "good_afternoon";
    if (hour >= 17 && hour < 22) return "good_evening";
    return "good_night";
}

export const GREETING_TEXT_EN: Record<GreetingKey, string> = {
    good_morning: "Good morning",
    good_afternoon: "Good afternoon",
    good_evening: "Good evening",
    good_night: "Good night",
};

export const GREETING_TEXT_ID: Record<GreetingKey, string> = {
    good_morning: "Selamat pagi",
    good_afternoon: "Selamat siang",
    good_evening: "Selamat sore",
    good_night: "Selamat malam",
};