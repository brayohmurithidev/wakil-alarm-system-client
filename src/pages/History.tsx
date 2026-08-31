import { History as HistoryIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AlarmsListPage } from "@/components/AlarmsTable/AlarmsListPage";

export function History() {
  const { t } = useTranslation();

  return (
    <AlarmsListPage
      scope="terminal"
      title={t("history.title", "History")}
      icon={<HistoryIcon size={30} />}
      emptyLabel={t("history.noClosedAlarms", "No closed or cancelled alarms found")}
    />
  );
}
