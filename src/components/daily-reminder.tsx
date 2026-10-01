"use client";

import { useState } from "react";

import { buildDailyReminder } from "@/lib/reminders/daily-reminder";

// « Me rappeler de réviser » : télécharge un événement quotidien à ajouter
// à l'agenda du téléphone (voir src/lib/reminders/daily-reminder.ts).
export function DailyReminder() {
  const [time, setTime] = useState("20:00");
  const [isDownloaded, setIsDownloaded] = useState(false);

  function download() {
    const [hour, minute] = time.split(":").map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
      return;
    }
    const ics = buildDailyReminder({ hour, minute, now: new Date(), reviewUrl: `${window.location.origin}/decks/reviser` });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "rappel-moriwords.ics";
    link.click();
    URL.revokeObjectURL(url);
    setIsDownloaded(true);
  }

  return (
    <details className="mt-4 border-t border-[var(--line)] pt-3 text-sm">
      <summary className="cursor-pointer font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
        📅 Me rappeler de réviser chaque jour
      </summary>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[var(--ink)]">
          À quelle heure ?
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="min-h-10 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-2 text-[var(--ink)]"
          />
        </label>
        <button type="button" onClick={download} className="secondary-button text-sm!">
          Ajouter à mon agenda
        </button>
      </div>
      <p className="mt-2 text-[var(--muted)]" role={isDownloaded ? "status" : undefined}>
        {isDownloaded
          ? "Fichier téléchargé : ouvre-le pour ajouter le rappel à ton agenda (Google Agenda, Calendrier, Outlook)."
          : "Un rappel de 15 minutes chaque jour dans ton agenda, avec le lien vers tes révisions."}
      </p>
    </details>
  );
}
