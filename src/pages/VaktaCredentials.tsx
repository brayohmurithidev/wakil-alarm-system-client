import { KeyRound, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { useVaktaCredentials } from "@/api/hooks/useVaktaCredentials";
import type { AlarmSourceCredential } from "@/api/types";
import { GenerateVaktaCredentialDialog } from "@/components/GenerateVaktaCredentialDialog";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { RevokeVaktaCredentialDialog } from "@/components/RevokeVaktaCredentialDialog";
import { Body, Button } from "@/components/ui";
import { apiUrl } from "@/config";

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString() : "Never";

export function VaktaCredentials() {
  const { data: credentials, isLoading, error } = useVaktaCredentials();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AlarmSourceCredential | null>(null);
  if (isLoading) return <Loading />;
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-8">
      <PageHeader title="Vakta Alarm Integration" icon={<ShieldCheck size={30} />} actions={<Button onClick={() => setGenerateOpen(true)}><Plus /> Generate API Key</Button>} />
      <p className="mb-6 text-sm text-muted-foreground">Settings / Integrations / Alarm Sources / Vakta</p>
      <div className="mb-6 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        <div><p className="text-xs uppercase text-muted-foreground">API endpoint</p><code className="mt-1 block break-all text-sm">{apiUrl.replace(/\/$/, "")}/api/alarms</code></div>
        <div><p className="text-xs uppercase text-muted-foreground">Authentication</p><code className="mt-1 block text-sm">X-API-Key</code></div>
      </div>
      <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm">
        <strong>Safe rotation:</strong> Generate a replacement, update Vakta’s <code>WAKIL_SOS_API_KEY</code>, reload Vakta, verify Last Used on the new credential, then revoke the old credential. This dashboard never edits Vakta’s environment.
      </div>
      {error ? <p role="alert" className="text-destructive">Credentials could not be loaded.</p> : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[900px]">
            <thead className="bg-muted"><tr>{["Name", "Prefix", "Status", "Created", "Last Used", "Created By", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 text-left text-sm font-medium">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {credentials?.map((credential) => (
                <tr key={credential.id}>
                  <td className="px-4 py-4"><Body className="font-medium">{credential.name}</Body>{credential.legacy && <span className="text-xs text-amber-500">Legacy plaintext</span>}</td>
                  <td className="px-4 py-4"><code>{credential.keyPrefix}</code></td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${credential.status === "ACTIVE" ? "bg-green-500/15 text-green-500" : "bg-muted text-muted-foreground"}`}>{credential.status}</span></td>
                  <td className="px-4 py-4 text-sm">{formatDate(credential.createdAt)}</td>
                  <td className="px-4 py-4 text-sm"><span title="Updated at most once every five minutes">{formatDate(credential.lastUsedAt)}</span></td>
                  <td className="px-4 py-4 text-sm">{credential.createdBy?.name ?? "Legacy / operator"}</td>
                  <td className="px-4 py-4">{credential.status === "ACTIVE" && <Button variant="destructive" size="sm" onClick={() => setRevokeTarget(credential)}><KeyRound /> Revoke</Button>}</td>
                </tr>
              ))}
              {!credentials?.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No Vakta credentials yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <GenerateVaktaCredentialDialog open={generateOpen} onOpenChange={setGenerateOpen} />
      <RevokeVaktaCredentialDialog credential={revokeTarget} onOpenChange={(open) => { if (!open) setRevokeTarget(null); }} />
    </div>
  );
}
