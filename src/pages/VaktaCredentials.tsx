import { Check, Copy, Info, KeyRound, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useIntegrationBySlug } from "@/api/hooks/useIntegrations";
import { useVaktaCredentials } from "@/api/hooks/useVaktaCredentials";
import type { AlarmSourceCredential } from "@/api/types";
import { GenerateVaktaCredentialDialog } from "@/components/GenerateVaktaCredentialDialog";
import { Loading } from "@/components/Loading";
import { RevokeVaktaCredentialDialog } from "@/components/RevokeVaktaCredentialDialog";
import { Body, Button } from "@/components/ui";
import { apiUrl } from "@/config";
import { credentialCounts, integrationStatusLabel } from "@/lib/integrationStatus";

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : "Never");

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function CopyPrefixButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy key prefix"}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export function VaktaCredentials() {
  const { data: credentials, isLoading: credentialsLoading, error } = useVaktaCredentials();
  const { data: integration, isLoading: integrationLoading } = useIntegrationBySlug("vakta");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AlarmSourceCredential | null>(null);
  if (credentialsLoading || integrationLoading) return <Loading />;

  // Credential counts stay derived from the credential list (unchanged data
  // source, per the instruction to keep credential data on the existing
  // endpoint where appropriate). Enabled/Disabled and the integration's own
  // created date now come from the real Integration record - Phase 2
  // deliberately allows Integration.status = DISABLED while individual
  // credentials still show isActive = true, so credential counts must never
  // be used to infer this. Both rules live in src/lib/integrationStatus.ts,
  // shared with AlarmSources.tsx and covered by integrationStatus.test.ts.
  const { total, active, revoked } = credentialCounts(credentials);
  const statusLabel = integrationStatusLabel(integration);
  const displayName = integration?.name ?? "Vakta";
  const lastActivity = credentials
    ?.map((c) => c.lastUsedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  const infoRows = [
    { label: "API Endpoint", value: <code className="break-all text-sm">{apiUrl.replace(/\/$/, "")}/api/alarms</code> },
    { label: "Authentication method", value: <code className="text-sm">X-API-Key</code> },
    {
      label: "Credential totals",
      value: (
        <span className="text-sm">
          {total} total <span className="text-muted-foreground">·</span>{" "}
          <span className="text-success">{active} active</span>{" "}
          <span className="text-muted-foreground">·</span> {revoked} revoked
        </span>
      ),
    },
    {
      label: "Last Activity",
      value: <span className="text-sm">{lastActivity ? `${timeAgo(lastActivity)} · ${formatDate(lastActivity)}` : "No activity recorded"}</span>,
    },
    {
      label: "Created",
      value: <span className="text-sm">{integration ? formatDate(integration.createdAt) : "—"}</span>,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-8">
      <Body size="sm" className="mb-4 pt-6 text-muted-foreground">
        <Link to="/integrations/alarm-sources" className="hover:text-foreground">Integrations</Link>
        <span className="mx-1">/</span>
        <Link to="/integrations/alarm-sources" className="hover:text-foreground">Alarm Sources</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">Vakta</span>
      </Body>

      <div className="mb-6 flex gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground">
          <ShieldCheck size={22} />
        </div>
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">{displayName} Alarm Integration</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusLabel === "Enabled" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
              {statusLabel}
            </span>
          </div>
          <Body size="sm" className="text-muted-foreground">
            Vakta is an external alarm provider integrated with Wakil Security.
          </Body>
        </div>
      </div>

      <div className="mb-6 divide-y divide-border rounded-xl border border-border bg-card">
        {infoRows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{row.label}</span>
            <span className="text-foreground sm:text-right">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <Info size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Safe rotation:</span> Generate a replacement,
          update Vakta&rsquo;s <code className="rounded bg-muted px-1 py-0.5 text-xs">WAKIL_SOS_API_KEY</code>,
          reload Vakta, verify Last Used on the new credential, then revoke the old credential. This
          dashboard never edits Vakta&rsquo;s environment.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">API Credentials</h2>
          <Body size="sm" className="text-muted-foreground">Manage API keys for this integration</Body>
        </div>
        <Button onClick={() => setGenerateOpen(true)} className="w-fit"><Plus /> Generate API Key</Button>
      </div>

      {error ? (
        <p role="alert" className="text-destructive">Credentials could not be loaded.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[860px]">
            <thead className="border-b border-border">
              <tr>
                {["Name", "Key Prefix", "Status", "Last Used", "Created / Created By", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {credentials?.map((credential) => (
                <tr key={credential.id}>
                  <td className="px-4 py-4 align-top">
                    <Body className="font-medium">{credential.name}</Body>
                    {credential.legacy && <Body size="sm" className="text-muted-foreground">Legacy plaintext credential</Body>}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-muted-foreground">{credential.keyPrefix}</code>
                      <CopyPrefixButton value={credential.keyPrefix} />
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {credential.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                        <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                        Active
                      </span>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
                          {credential.status === "REVOKED" ? "Revoked" : "Expired"}
                        </span>
                        {credential.revokedAt && (
                          <Body size="sm" className="mt-0.5 text-muted-foreground">Revoked {formatDate(credential.revokedAt)}</Body>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className="text-sm text-foreground" title="Updated at most once every five minutes">{formatDate(credential.lastUsedAt)}</span>
                    {credential.lastUsedAt && <Body size="sm" className="text-muted-foreground">{timeAgo(credential.lastUsedAt)}</Body>}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className="text-sm text-foreground">{formatDate(credential.createdAt)}</span>
                    <Body size="sm" className="text-muted-foreground">{credential.createdBy?.name ?? "Legacy / operator"}</Body>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {credential.status === "ACTIVE" ? (
                      <Button variant="destructive" size="sm" onClick={() => setRevokeTarget(credential)}>
                        <KeyRound /> Revoke
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!credentials?.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No Vakta credentials yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <GenerateVaktaCredentialDialog open={generateOpen} onOpenChange={setGenerateOpen} />
      <RevokeVaktaCredentialDialog credential={revokeTarget} onOpenChange={(open) => { if (!open) setRevokeTarget(null); }} />
    </div>
  );
}
