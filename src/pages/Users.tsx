import { ListFilter, UserPlus,Users as UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetUsers } from "@/api/hooks/useGetUsers";
import type { AdminUser } from "@/api/types";
import { AboutRolesDialog } from "@/components/AboutRolesDialog";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { DisableUserDialog } from "@/components/DisableUserDialog";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button, Input } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu/dropdown-menu";
import { UpdateUserDialog } from "@/components/UpdateUserDialog";
import { UserAccountStatusBadge } from "@/components/UserAccountStatusBadge";
import { UserActionsMenu } from "@/components/UserActionsMenu";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABEL } from "@/lib/adminUserManagementPermissions";
import { ACCOUNT_STATUS_LABEL, summarizeAccountStatuses } from "@/lib/userAccountStatus";
import {
  ALL_ROLES,
  ALL_STATUSES,
  applyUserListFilters,
  countActiveUserListFilters,
  getDefaultUserListFilters,
  type UserListFilters,
} from "@/lib/userListFilters";

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

export function Users() {
  const { t } = useTranslation();
  const { adminUser } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [disableTarget, setDisableTarget] = useState<AdminUser | null>(null);
  const [filters, setFilters] = useState<UserListFilters>(getDefaultUserListFilters());

  const {
    data: users,
    isLoading: isGetUsersLoading,
    error: getUsersError,
  } = useGetUsers();

  const handleEditClick = (user: AdminUser) => {
    setSelectedUser(user);
    setIsUpdateDialogOpen(true);
  };

  const toggleRole = (role: (typeof ALL_ROLES)[number]) => {
    const next = new Set(filters.roles);
    if (next.has(role)) next.delete(role);
    else next.add(role);
    setFilters({ ...filters, roles: next });
  };

  const toggleStatus = (status: (typeof ALL_STATUSES)[number]) => {
    const next = new Set(filters.statuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    setFilters({ ...filters, statuses: next });
  };

  const summary = useMemo(() => summarizeAccountStatuses(users ?? []), [users]);
  const filteredUsers = useMemo(
    () => (users ? applyUserListFilters(users, filters) : []),
    [users, filters],
  );
  const activeFilterCount = countActiveUserListFilters(filters);

  // Mirrors Sidebar.tsx's own "Users" nav gate (adminUser?.role === "ADMIN")
  // - the backend (requireRole(["ADMIN"])) remains the actual gate; this is
  // only so a Dispatcher/Supervisor who lands on this route directly (it
  // isn't otherwise route-guarded) sees a clear explanation instead of a
  // blank page.
  if (adminUser && adminUser.role !== "ADMIN") {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-8">
        <PageHeader title={t("users.title", "User Management")} icon={<UsersIcon size={30} />} />
        <p className="text-muted-foreground">
          {t("users.accessDenied", "Only Admins can manage Control Center users.")}
        </p>
      </div>
    );
  }

  if (isGetUsersLoading) return <Loading />;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-8 sm:px-8">
      <PageHeader
        title={t("users.title", "User Management")}
        icon={<UsersIcon size={30} />}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("users.createUser", "Add User")}
          </Button>
        }
      />
      <div className="-mt-2 mb-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t(
            "users.subtitle",
            "Manage Control Center access, roles, invitations and account security.",
          )}
        </p>
        <AboutRolesDialog />
      </div>

      {getUsersError ? (
        <p role="alert" className="text-destructive">
          {t("users.loadError", "Users could not be loaded. Try refreshing the page.")}
        </p>
      ) : (
        <>
          {/* One restrained neutral summary container, not four colored
              cards - see the User Management UI Redesign report's
              "Color-system discipline" section. */}
          <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Total Users</dt>
              <dd className="mt-1 text-xl font-semibold text-foreground">{summary.total}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Active</dt>
              <dd className="mt-1 text-xl font-semibold text-success">{summary.active}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Pending Activation</dt>
              <dd className="mt-1 text-xl font-semibold text-primary">{summary.pending}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Disabled</dt>
              <dd className="mt-1 text-xl font-semibold text-muted-foreground">{summary.disabled}</dd>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder={t("users.search.placeholder", "Search by name, email or phone")}
              className="sm:max-w-xs"
              aria-label={t("users.search.label", "Search users")}
            />
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ListFilter size={14} />
                    {t("users.filters.label", "Filters")}
                    {activeFilterCount > 0 && (
                      <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t("users.filters.role", "Role")}</DropdownMenuLabel>
                  {ALL_ROLES.map((role) => (
                    <DropdownMenuCheckboxItem
                      key={role}
                      checked={filters.roles.has(role)}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={() => toggleRole(role)}
                    >
                      {ROLE_LABEL[role]}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>{t("users.filters.status", "Account Status")}</DropdownMenuLabel>
                  {ALL_STATUSES.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={filters.statuses.has(status)}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={() => toggleStatus(status)}
                    >
                      {ACCOUNT_STATUS_LABEL[status]}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setFilters(getDefaultUserListFilters())}>
                    {t("users.filters.reset", "Reset filters")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-border">
                <tr>
                  {[
                    t("users.table.user", "User"),
                    t("users.table.role", "Role"),
                    t("users.table.status", "Account Status"),
                    t("users.table.contact", "Contact"),
                    t("users.table.created", "Created"),
                    t("users.table.actions", "Actions"),
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-4 align-top">
                      <Body className="font-medium text-foreground">{user.name}</Body>
                      <Body size="sm" className="text-muted-foreground">{user.email}</Body>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <Body className="text-foreground">{ROLE_LABEL[user.role]}</Body>
                      {user.isSuperAdmin && (
                        <Body size="sm" className="text-muted-foreground">Super Admin</Body>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <UserAccountStatusBadge user={user} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <Body className="text-foreground">{user.phone || "—"}</Body>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <Body size="sm" className="text-muted-foreground">{formatDate(user.createdAt)}</Body>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {adminUser && (
                        <UserActionsMenu
                          actor={adminUser}
                          target={user}
                          onEdit={handleEditClick}
                          onDisable={setDisableTarget}
                        />
                      )}
                    </td>
                  </tr>
                ))}
                {!filteredUsers.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      {!users?.length
                        ? t("users.empty", "No Control Center users yet.")
                        : t("users.emptyFiltered", "No users match these filters.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <CreateUserDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      <UpdateUserDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        user={selectedUser}
        onRequestDisable={(user) => {
          setIsUpdateDialogOpen(false);
          setDisableTarget(user);
        }}
      />

      <DisableUserDialog user={disableTarget} onOpenChange={(open) => { if (!open) setDisableTarget(null); }} />
    </div>
  );
}
