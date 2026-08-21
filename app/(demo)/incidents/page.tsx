import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageFooter } from "@/components/PageFooter";
import { SealChip } from "@/components/SealChip";
import { cells } from "@/data/cells";
import { evaluateCell } from "@/lib/containment";

export const metadata: Metadata = {
  title: "Incident strip",
  description:
    "What left the cell, who was reached, whether they detected it, and who owns IR.",
};

export default function IncidentsPage() {
  const strips = cells.filter((cell) => cell.incident);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
        Incident
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-ivory">
        Incident strip
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
        What left the cell, who was reached, whether they had detected it, and
        who owns IR.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-faint">
        After-action only. No attacker timeline, no payload, no SOC view.
      </p>

      {strips.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">No after-action strips.</p>
      ) : (
        <ul className="mt-10 space-y-8">
          {strips.map((cell) => {
            const incident = cell.incident!;
            const verdict = evaluateCell(cell);
            const undetected = incident.orgsReached.every(
              (org) => org.detected === false,
            );
            return (
              <li key={cell.id}>
                <article className="relative overflow-hidden rounded-xl border border-hairline bg-surface px-5 py-6 sm:px-7">
                  <span
                    className="absolute inset-y-0 left-0 w-0.5 bg-danger"
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      {cell.scene !== undefined ? (
                        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                          Scene {cell.scene}
                        </p>
                      ) : null}
                      <h2 className="mt-1 font-display text-2xl text-ivory">
                        {cell.name}
                      </h2>
                    </div>
                    <SealChip band={verdict.band} />
                  </div>

                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-conditional">
                    Found in transcript review. The orgs had not detected the
                    contact.
                  </p>

                  <dl className="mt-8 grid gap-6 sm:grid-cols-2">
                    <Field label="What left the cell">
                      <p className="text-sm leading-relaxed text-ivory">
                        {incident.whatLeft}
                      </p>
                    </Field>
                    <Field label="Who owns IR">
                      <p className="font-display text-xl text-ivory">
                        {incident.irOwner}
                      </p>
                      <p className="mt-1 text-xs text-ink-faint">
                        A person, not a team alias.
                      </p>
                    </Field>
                  </dl>

                  <div className="mt-8">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      Who was reached
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {undetected
                        ? "None of the three desks had detected it."
                        : "Detection status per org."}
                    </p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
                        <caption className="sr-only">
                          Organizations reached and whether they had detected
                          the contact
                        </caption>
                        <thead>
                          <tr className="border-b border-hairline text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                            <th scope="col" className="py-2 pr-4 font-medium">
                              Organization
                            </th>
                            <th scope="col" className="py-2 font-medium">
                              Detected
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {incident.orgsReached.map((org) => (
                            <tr
                              key={org.name}
                              className="border-b border-hairline last:border-0"
                            >
                              <th
                                scope="row"
                                className="py-2.5 pr-4 font-normal text-ivory"
                              >
                                {org.name}
                              </th>
                              <td
                                className={
                                  org.detected ? "text-sealed" : "text-danger"
                                }
                              >
                                {org.detected ? "Yes" : "No"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="mt-6">
                    <Link
                      href={`/cells/${cell.id}`}
                      className="text-sm text-data underline-offset-4 hover:underline"
                    >
                      Open cell
                    </Link>
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <PageFooter />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-2">{children}</dd>
    </div>
  );
}
