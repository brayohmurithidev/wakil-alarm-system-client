import { Info } from "lucide-react";

import { Body, Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog/dialog";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABEL,
  SUPER_ADMIN_DESCRIPTION,
} from "@/lib/adminUserManagementPermissions";

const ROLES = ["DISPATCHER", "SUPERVISOR", "ADMIN"] as const;

export function AboutRolesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Info size={14} />
          About roles
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Control Center roles</DialogTitle>
          <DialogDescription>What each role can actually do today.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {ROLES.map((role) => (
            <div key={role}>
              <p className="text-sm font-semibold text-foreground">{ROLE_LABEL[role]}</p>
              <Body size="sm" className="text-muted-foreground">
                {ROLE_DESCRIPTIONS[role]}
              </Body>
            </div>
          ))}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground">Super Admin</p>
            <Body size="sm" className="text-muted-foreground">
              {SUPER_ADMIN_DESCRIPTION}
            </Body>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
