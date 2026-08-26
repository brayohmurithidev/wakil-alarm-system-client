import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import type { PendingReassign } from "@/hooks/useReassignGuardFlow";

export function ReassignGuardDialog({
  pending,
  isPending,
  onConfirm,
  onCancel,
}: {
  pending: PendingReassign | null;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={pending !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Reassign guard?</DialogTitle>
          <DialogDescription>
            {pending && (
              <>
                This alarm is currently assigned to{" "}
                <strong className="text-foreground">{pending.fromGuardName}</strong>.
                Reassign to{" "}
                <strong className="text-foreground">{pending.toGuardName}</strong>?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? "Reassigning…" : "Reassign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
