// Rappel quotidien de révision sous forme de fichier agenda (.ics), lu par
// Google Agenda, Calendrier (iPhone) et Outlook : un rappel fiable sans
// serveur de notifications ni compte tiers.

const pad = (value: number) => String(value).padStart(2, "0");

// Date locale « flottante » (sans fuseau) : l'agenda la place à l'heure
// locale du téléphone, même en voyage.
function localStamp(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Texte d'un champ iCalendar : virgules, points-virgules et retours échappés.
const escapeText = (text: string) => text.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");

// Premier rappel : aujourd'hui si l'heure n'est pas passée, sinon demain.
export function firstReminder(hour: number, minute: number, now: Date): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  if (start.getTime() <= now.getTime()) {
    start.setDate(start.getDate() + 1);
  }
  return start;
}

export function buildDailyReminder({
  hour,
  minute,
  now,
  reviewUrl,
}: {
  hour: number;
  minute: number;
  now: Date;
  reviewUrl: string;
}): string {
  const start = firstReminder(hour, minute, now);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MoriWords//Rappel de revision//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:moriwords-rappel-${utcStamp(now)}@moriwords`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${localStamp(start)}`,
    "DURATION:PT15M",
    "RRULE:FREQ=DAILY",
    `SUMMARY:${escapeText("Révision de japonais (MoriWords)")}`,
    `DESCRIPTION:${escapeText(`15 minutes pour revoir tes mots avant de les oublier : ${reviewUrl}`)}`,
    `URL:${reviewUrl}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText("C'est l'heure de réviser ton japonais")}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // La norme demande des fins de ligne CRLF.
  return `${lines.join("\r\n")}\r\n`;
}
