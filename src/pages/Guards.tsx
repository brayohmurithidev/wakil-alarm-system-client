import { ChevronDown, ShieldUser } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetGuards } from "@/api/hooks/useGetGuards";
import { PageHeader } from "@/components/PageHeader";
import { Body, Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

type FilterType = "all" | "active" | "inactive";

export function Guards() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: guards, isLoading } = useGetGuards(
    filter === "all" ? undefined : { isActive: filter === "active" },
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActiveAlarmsCount = (guard: any) => {
    return guard.alarms?.length || 0;
  };

  return (
    <div className="min-w-7xl">
      <PageHeader
        title={t("guards.title", "Guards")}
        icon={<ShieldUser size={30} />}
      />

      <div className="mb-6 px-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {filter === "all"
                ? t("guards.filter.all", "All Guards")
                : filter === "active"
                  ? t("guards.filter.active", "Active")
                  : t("guards.filter.inactive", "Inactive")}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilter("all")}>
              {t("guards.filter.all", "All Guards")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("active")}>
              {t("guards.filter.active", "Active")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("inactive")}>
              {t("guards.filter.inactive", "Inactive")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Body>{t("common.loading", "Loading...")}</Body>
        </div>
      ) : guards && guards.length > 0 ? (
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.name", "Name")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.phone", "Phone")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.email", "Email")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.activeAlarms", "Active Alarms")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.status", "Status")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                    {t("guards.table.joined", "Joined")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {guards.map((guard) => (
                  <tr key={guard.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <Body className="font-medium">{guard.name}</Body>
                    </td>
                    <td className="px-6 py-4">
                      <Body>{guard.phone}</Body>
                    </td>
                    <td className="px-6 py-4">
                      <Body size="sm">{guard.email || "-"}</Body>
                    </td>
                    <td className="px-6 py-4">
                      <Body className="font-medium">
                        {getActiveAlarmsCount(guard)}
                      </Body>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          guard.isActive
                            ? "bg-green-500/10 text-green-600"
                            : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        {guard.isActive
                          ? t("guards.status.active", "Active")
                          : t("guards.status.inactive", "Inactive")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Body size="sm">{formatDate(guard.createdAt)}</Body>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-card rounded-lg">
          <Body className="text-muted-foreground">
            {t("guards.noGuards", "No guards found")}
          </Body>
        </div>
      )}
    </div>
  );
}
