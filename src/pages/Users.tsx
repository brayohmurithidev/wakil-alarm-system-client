import { Edit, UserPlus, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetUsers } from "@/api/hooks/useGetUsers";
import type { AdminUser } from "@/api/types";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button } from "@/components/ui";
import { UpdateUserDialog } from "@/components/UpdateUserDialog";

export function Users() {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const {
    data: users,
    isLoading: isGetUsersLoading,
    error: isGetUsersError,
  } = useGetUsers();

  const handleEditClick = (user: AdminUser) => {
    setSelectedUser(user);
    setIsUpdateDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "SUPERVISOR":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "DISPATCHER":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "SUPERVISOR":
        return "Supervisor";
      case "DISPATCHER":
        return "Dispatcher";
      default:
        return role;
    }
  };

  if (isGetUsersLoading) return <Loading />;
  if (isGetUsersError) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-8 sm:px-8">
      <PageHeader
        title={t("users.title", "Users")}
        icon={<UsersIcon size={30} />}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("users.createUser", "Create User")}
          </Button>
        }
      />

      {users && users.length > 0 && (
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("users.table.name", "Name")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("users.table.email", "Email")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("users.table.phone", "Phone")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("users.table.role", "Role")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("users.table.status", "Status")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("users.table.created", "Created")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <Body className="font-medium text-foreground">
                        {user.name}
                      </Body>
                    </td>
                    <td className="px-6 py-4">
                      <Body>{user.email}</Body>
                    </td>
                    <td className="px-6 py-4">
                      <Body>{user.phone}</Body>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-sm text-sm font-semibold border ${getRoleBadgeColor(user.role)}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-sm text-sm font-semibold border ${
                          user.isActive
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-red-100 text-red-800 border-red-300"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Body size="sm">{formatDate(user.createdAt)}</Body>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(user)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t("users.table.edit", "Edit")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <UpdateUserDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        user={selectedUser}
      />
    </div>
  );
}
