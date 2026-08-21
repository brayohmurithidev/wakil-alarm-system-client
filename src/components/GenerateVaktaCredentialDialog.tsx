import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";

import { useCreateVaktaCredential } from "@/api/hooks/useVaktaCredentials";
import { Button, Input } from "@/components/ui";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/Dialog/dialog";
import { clearCredentialSecret } from "@/lib/credentialSecretState";

export function GenerateVaktaCredentialDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const createCredential = useCreateVaktaCredential();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSecret(clearCredentialSecret());
      setName("");
      setCopied(false);
      createCredential.reset();
    }
    onOpenChange(nextOpen);
  };

  const generate = async () => {
    const result = await createCredential.mutateAsync(name.trim());
    setSecret(result.secret);
  };
  const copy = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" onEscapeKeyDown={() => setSecret(clearCredentialSecret())}>
        <DialogHeader>
          <DialogTitle>{secret ? "New API key" : "Generate API key"}</DialogTitle>
          <DialogDescription>
            {secret
              ? "This key will only be shown once. Copy and store it securely before closing this dialog."
              : "Create an inbound credential for the Vakta alarm source."}
          </DialogDescription>
        </DialogHeader>
        {secret ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-500">New API key</p>
              <code className="block break-all text-sm" data-testid="generated-credential-secret">{secret}</code>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={copy}>
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        ) : (
          <label className="space-y-2">
            <span className="text-sm font-medium">Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Vakta Staging" maxLength={100} autoComplete="off" />
          </label>
        )}
        <DialogFooter className="px-0 pb-0">
          {secret ? (
            <Button onClick={() => handleOpenChange(false)}>I have stored the key</Button>
          ) : (
            <Button onClick={generate} disabled={!name.trim() || createCredential.isPending}>
              <KeyRound /> {createCredential.isPending ? "Generating…" : "Generate"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
