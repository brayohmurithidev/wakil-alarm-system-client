import { Cable, ChevronRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { useIntegrationBySlug } from "@/api/hooks/useIntegrations";
import { useVaktaCredentials } from "@/api/hooks/useVaktaCredentials";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button } from "@/components/ui";
import { credentialCounts, integrationStatusLabel } from "@/lib/integrationStatus";

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function AlarmSources() {
  const { data: credentials, isLoading: credentialsLoading } = useVaktaCredentials();
  const { data: integration, isLoading: integrationLoading } = useIntegrationBySlug("vakta");
  if (credentialsLoading || integrationLoading) return <Loading />;

  // Credential counts are derived from the credential list this page
  // already fetches - unchanged. Enabled/Disabled is NOT: Integration.status
  // is the sole authority (Phase 2 deliberately allows a DISABLED
  // integration with individually-still-active credentials - authentication
  // is blocked at the integration level without touching them), so that one
  // field comes from the real Integration record, never from whether any
  // credential happens to be active. Both rules live in
  // src/lib/integrationStatus.ts, shared with VaktaCredentials.tsx and
  // covered by integrationStatus.test.ts.
  const { total, active, revoked } = credentialCounts(credentials);
  const lastActivity = credentials
    ?.map((c) => c.lastUsedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const statusLabel = integrationStatusLabel(integration);
  const displayName = integration?.name ?? "Vakta";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-8">
      <Body size="sm" className="mb-1 pt-6 text-muted-foreground">
        Integrations <span className="mx-1">/</span>
        <span className="text-foreground">Alarm Sources</span>
      </Body>
      <PageHeader title="Alarm Sources" icon={<Cable size={28} />} />
      <p className="-mt-2 mb-6 text-sm text-muted-foreground">
        Manage external alarm providers and their API credentials.
      </p>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">{displayName} Alarm Integration</h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusLabel === "Enabled" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              <Body size="sm" className="max-w-md text-muted-foreground">
                Vakta is an external alarm provider integrated with Wakil Security.
              </Body>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to="/integrations/alarm-sources/vakta">
              Manage <ChevronRight />
            </Link>
          </Button>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Credentials</dt>
            <dd className="mt-1 text-sm text-foreground">
              {total} total
              <span className="text-muted-foreground"> · </span>
              <span className="text-success">{active} active</span>
              <span className="text-muted-foreground"> · </span>
              <span className="text-muted-foreground">{revoked} revoked</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Last activity</dt>
            <dd className="mt-1 text-sm text-foreground">
              {lastActivity ? timeAgo(lastActivity) : "No activity recorded"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
