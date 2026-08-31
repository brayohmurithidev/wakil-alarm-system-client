import { useTranslation } from "react-i18next";

import { AlarmsListPage } from "@/components/AlarmsTable/AlarmsListPage";
import { AlarmIcon } from "@/components/icons/AlarmIcon";

export function Alarms() {
  const { t } = useTranslation();

  return (
    <AlarmsListPage
      scope="operational"
      title={t("alarms.title")}
      icon={<AlarmIcon size={30} />}
      emptyLabel={t("alarms.noAlarms", "No active alarms")}
    />
  );
}
