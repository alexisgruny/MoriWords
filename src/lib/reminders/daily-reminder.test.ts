import { describe, expect, it } from "vitest";

import { buildDailyReminder, firstReminder } from "./daily-reminder";

describe("rappel quotidien (.ics)", () => {
  it("starts today if the time is still ahead, otherwise tomorrow", () => {
    const morning = new Date(2026, 9, 1, 9, 0);
    expect(firstReminder(20, 0, morning)).toEqual(new Date(2026, 9, 1, 20, 0));
    const night = new Date(2026, 9, 1, 21, 30);
    expect(firstReminder(20, 0, night)).toEqual(new Date(2026, 9, 2, 20, 0));
  });

  it("builds a daily event with an alert and a link to the reviews", () => {
    const ics = buildDailyReminder({
      hour: 20,
      minute: 30,
      now: new Date(2026, 9, 1, 9, 0),
      reviewUrl: "https://moriwords.vercel.app/decks/reviser",
    });
    const lines = ics.split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("DTSTART:20261001T203000");
    expect(lines).toContain("RRULE:FREQ=DAILY");
    expect(lines).toContain("BEGIN:VALARM");
    expect(lines).toContain("URL:https://moriwords.vercel.app/decks/reviser");
    // Ponctuation échappée selon la norme iCalendar.
    expect(ics).toContain("pour revoir tes mots avant de les oublier : https");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
  });
});
