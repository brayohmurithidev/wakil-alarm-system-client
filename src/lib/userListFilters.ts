// Client-side search/filter for the Users table - GET /api/users returns
// the full, unpaginated list (see getAllUsersController), so filtering here
// rather than adding backend query params matches the existing dataset
// architecture instead of inventing one.

import type { AdminRole, AdminUser } from "@/api/types";
import { deriveAccountStatus, type UserAccountStatus } from "@/lib/userAccountStatus";

export const ALL_ROLES: AdminRole[] = ["DISPATCHER", "SUPERVISOR", "ADMIN"];
export const ALL_STATUSES: UserAccountStatus[] = ["active", "pending", "disabled"];

export type UserListFilters = {
  search: string;
  roles: Set<AdminRole>;
  statuses: Set<UserAccountStatus>;
};

export function getDefaultUserListFilters(): UserListFilters {
  return { search: "", roles: new Set(ALL_ROLES), statuses: new Set(ALL_STATUSES) };
}

export function countActiveUserListFilters(filters: UserListFilters): number {
  const roleDeselected = ALL_ROLES.length - filters.roles.size;
  const statusDeselected = ALL_STATUSES.length - filters.statuses.size;
  const searchActive = filters.search.trim() ? 1 : 0;
  return roleDeselected + statusDeselected + searchActive;
}

export function applyUserListFilters(users: AdminUser[], filters: UserListFilters): AdminUser[] {
  const query = filters.search.trim().toLowerCase();

  return users.filter((user) => {
    if (!filters.roles.has(user.role)) return false;
    if (!filters.statuses.has(deriveAccountStatus(user))) return false;

    if (query) {
      const haystack = `${user.name} ${user.email} ${user.phone}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}
