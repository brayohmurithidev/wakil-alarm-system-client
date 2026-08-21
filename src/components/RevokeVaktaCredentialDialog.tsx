import { useState } from "react";

import { useRevokeVaktaCredential } from "@/api/hooks/useVaktaCredentials";
import type { AlarmSourceCredential } from "@/api/types";
import { Button, Textarea } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog/dialog";

export function RevokeVaktaCredentialDialog({ credential, onOpenChange }: { credential: AlarmSourceCredential | null; onOpenChange: (open: boolean) => void }) {
  const [reason, setReason] = useState("");
  const revoke = useRevokeVaktaCredential();
  const close = () => { setReason(""); onOpenChange(false); };
  const confirm = async () => {
    if (!credential) return;
    await revoke.mutateAsync({ id: credential.id, reason: reason.trim() || undefined });
    close();
  };
  return (
    <Dialog open={!!credential} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke {credential?.name}?</DialogTitle>
          <DialogDescription>Requests using this key will stop authenticating immediately. This action preserves historical metadata and cannot be undone.</DialogDescription>
        </DialogHeader>
        <label className="space-y-2"><span className="text-sm font-medium">Reason (optional)</span><Textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} /></label>
        <DialogFooter className="px-0 pb-0"><Button variant="outline" onClick={close}>Cancel</Button><Button variant="destructive" onClick={confirm} disabled={revoke.isPending}>{revoke.isPending ? "Revoking…" : "Revoke"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
