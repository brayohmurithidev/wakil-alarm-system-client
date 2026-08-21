import { Cable, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useVaktaCredentials } from "@/api/hooks/useVaktaCredentials";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button } from "@/components/ui";

export function AlarmSources() {
  const { data: credentials, isLoading } = useVaktaCredentials();
  if (isLoading) return <Loading />;
  const active = credentials?.filter((credential) => credential.status === "ACTIVE") ?? [];
  const lastUsed = credentials?.map((credential) => credential.lastUsedAt).filter(Boolean).sort().at(-1);
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-8">
      <PageHeader title="Alarm Sources" icon={<Cable size={30} />} />
      <p className="mb-6 text-sm text-muted-foreground">Settings / Integrations / Alarm Sources</p>
      <section className="rounded-xl border border-border bg-card p-6 shadow-md">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3"><h2 className="text-xl font-semibold">Vakta</h2><span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-500">{active.length > 0 ? "Active" : "No active credentials"}</span></div>
            <Body>{active.length} active credential{active.length === 1 ? "" : "s"}</Body>
            <Body size="sm" className="mt-1 text-muted-foreground">Last authenticated request: {lastUsed ? new Date(lastUsed).toLocaleString() : "No activity recorded"}</Body>
          </div>
          <Button asChild><Link to="/settings/integrations/alarm-sources/vakta">Manage <ChevronRight /></Link></Button>
        </div>
      </section>
    </div>
  );
}
