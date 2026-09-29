import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getUsageStats, isAdminEmail, type UsageTotals } from "@/lib/admin/usage-stats";
import { auth } from "@/lib/auth/auth";

export const metadata: Metadata = { title: "Admin · MoriWords" };

const ACTION_LABELS: Record<string, string> = {
  translate: "Traduction (analyse)",
  "card-add": "Ajout au deck",
  "card-examples": "Exemples d'une carte",
  "translate-missing": "Traduction des mots sans sens",
  exercise: "Génération d'exercices",
  correction: "Correction d'exercice",
  "anime-quote": "Réplique d'anime",
  "daily-dialogue": "Dialogue du quotidien",
  "literary-excerpt": "Extrait littéraire",
  "news-summary": "Actu simplifiée",
};

const formatUsd = (value: number) => `${value.toFixed(value < 1 ? 3 : 2)} $`;
const formatTokens = (value: number) => value.toLocaleString("fr-FR");

function TotalsCard({ label, totals }: { label: string; totals: UsageTotals }) {
  return (
    <div className="panel">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--ink)]">{formatUsd(totals.costUsd)}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {totals.calls} appel(s) · {formatTokens(totals.inputTokens)} tokens entrée ·{" "}
        {formatTokens(totals.outputTokens)} sortie
      </p>
    </div>
  );
}

function UsageTable({ title, rows }: { title: string; rows: Array<UsageTotals & { label: string }> }) {
  return (
    <section className="panel">
      <h2 className="text-[var(--ink)]">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">Aucun appel sur la période.</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="py-1.5 font-semibold">Nom</th>
              <th className="py-1.5 text-right font-semibold">Appels</th>
              <th className="py-1.5 text-right font-semibold">Coût</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-[var(--line)] text-[var(--ink)]">
                <td className="py-1.5 break-all">{row.label}</td>
                <td className="py-1.5 text-right">{row.calls}</td>
                <td className="py-1.5 text-right font-semibold">{formatUsd(row.costUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// Tableau de bord du propriétaire : coût réel de Claude (appels hors cache)
// par jour, par action et par compte. Invisible (404) pour les autres comptes.
export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);

  if (!session || !isAdminEmail(session.user.email)) {
    notFound();
  }

  const stats = await getUsageStats();
  const maxDailyCost = Math.max(...stats.daily.map((day) => day.costUsd), 0);

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="fade-in-up">
          <h1 className="text-[var(--ink)]">Admin</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Coût estimé des appels réels à Claude (hors cache), tarif Haiku 4.5. {stats.accounts.total} compte(s),
            dont {stats.accounts.newLast7Days} nouveau(x) sur 7 jours.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <TotalsCard label="Aujourd'hui (UTC)" totals={stats.today} />
          <TotalsCard label="7 derniers jours" totals={stats.last7Days} />
          <TotalsCard label="30 derniers jours" totals={stats.last30Days} />
        </div>

        <section className="panel">
          <h2 className="text-[var(--ink)]">Coût par jour (30 jours)</h2>
          <ol className="mt-4 flex h-40 items-end gap-1" aria-label="Coût par jour">
            {stats.daily.map((day) => (
              <li
                key={day.day}
                className="flex h-full flex-1 items-end"
                title={`${day.day} : ${formatUsd(day.costUsd)}, ${day.calls} appel(s)`}
              >
                <span className="sr-only">{`${day.day} : ${formatUsd(day.costUsd)}, ${day.calls} appel(s)`}</span>
                <span
                  aria-hidden="true"
                  className="w-full rounded-t bg-[var(--accent)]"
                  style={{ height: maxDailyCost > 0 ? `${Math.max((day.costUsd / maxDailyCost) * 100, day.calls > 0 ? 2 : 0)}%` : 0 }}
                />
              </li>
            ))}
          </ol>
          <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
            <span>{stats.daily[0]?.day}</span>
            <span>{stats.daily.at(-1)?.day}</span>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <UsageTable
            title="Par action (30 jours)"
            rows={stats.byAction.map((row) => ({ ...row, label: ACTION_LABELS[row.action] ?? row.action }))}
          />
          <UsageTable
            title="Par compte (30 jours, 20 premiers)"
            rows={stats.byAccount.map((row, index) => ({ ...row, label: row.email ?? `Compte supprimé ${index + 1}` }))}
          />
        </div>
      </div>
    </main>
  );
}
