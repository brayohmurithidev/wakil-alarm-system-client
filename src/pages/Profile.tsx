import { Edit, User } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetMe } from "@/api/hooks/useGetMe";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button, Heading } from "@/components/ui";
import { UpdateProfileDialog } from "@/components/UpdateProfileDialog";

export function Profile() {
  const { t } = useTranslation();
  const { data: adminUser, isLoading } = useGetMe();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

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

  if (isLoading) return <Loading />;
  if (!adminUser) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-8 sm:px-8">
      <PageHeader
        title={t("profile.title", "Profile")}
        icon={<User size={30} />}
        actions={
          <Button onClick={() => setIsUpdateDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            {t("profile.editProfile", "Edit Profile")}
          </Button>
        }
      />

      <div className="max-w-3xl">
        <div className="bg-card rounded-lg shadow-md p-6">
          <Heading size="lg" className="mb-6">
            {t("profile.info", "Account Information")}
          </Heading>

          <div className="space-y-6">
            <div>
              <Body size="sm" className="text-muted-foreground mb-1">
                {t("profile.name", "Name")}
              </Body>
              <Body className="font-medium text-lg">{adminUser.name}</Body>
            </div>

            <div>
              <Body size="sm" className="text-muted-foreground mb-1">
                {t("profile.email", "Email")}
              </Body>
              <Body className="font-medium text-lg">{adminUser.email}</Body>
            </div>

            <div>
              <Body size="sm" className="text-muted-foreground mb-1">
                {t("profile.phone", "Phone")}
              </Body>
              <Body className="font-medium text-lg">{adminUser.phone}</Body>
            </div>

            <div>
              <Body size="sm" className="text-muted-foreground mb-1">
                {t("profile.role", "Role")}
              </Body>
              <span
                className={`inline-block px-3 py-1.5 rounded-sm text-sm font-semibold border ${getRoleBadgeColor(adminUser.role)}`}
              >
                {getRoleLabel(adminUser.role)}
              </span>
            </div>

            <div>
              <Body size="sm" className="text-muted-foreground mb-1">
                {t("profile.status", "Status")}
              </Body>
              <span
                className={`inline-block px-3 py-1.5 rounded-sm text-sm font-semibold border ${
                  adminUser.isActive
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-red-100 text-red-800 border-red-300"
                }`}
              >
                {adminUser.isActive
                  ? t("profile.active", "Active")
                  : t("profile.inactive", "Inactive")}
              </span>
            </div>

            {adminUser.createdAt && (
              <div>
                <Body size="sm" className="text-muted-foreground mb-1">
                  {t("profile.memberSince", "Member Since")}
                </Body>
                <Body className="font-medium">
                  {formatDate(adminUser.createdAt)}
                </Body>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpdateProfileDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
      />
    </div>
  );
}
