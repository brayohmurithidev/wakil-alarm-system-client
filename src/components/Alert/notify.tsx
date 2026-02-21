import clsx from "clsx";
import { toast } from "react-toastify";

import { Alert, type AlertType } from "./Alert";

const notify = Object.assign(
  (
    message: React.ReactNode,
    { type, ...options }: { type: AlertType } = { type: "success" },
  ) =>
    toast(
      () => (
        <Alert
          type={type}
          className={clsx({
            "text-green-700": type === "success",
            "text-orange-700": type === "warning",
            "text-red-700": type === "error",
            "text-blue-700": type === "neutral",
          })}
        >
          {message}
        </Alert>
      ),
      {
        className: clsx(
          "!min-h-0 !rounded !border !p-4 !text-body !shadow-md",
          {
            "!bg-green-100": type === "success",
            "!bg-orange-100": type === "warning",
            "!bg-red-100": type === "error",
            "!bg-blue-100": type === "neutral",
          },
        ),
        ...options,
      },
    ),
  toast,
);

export { notify };
