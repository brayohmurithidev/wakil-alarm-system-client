import clsx from "clsx";
import { LoaderIcon } from "./icons";

type LoadingProps = {
  size?: number;
  className?: string;
  text?: string;
};

export const Loading = ({ size = 50, className, text }: LoadingProps) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-2",
        className
      )}
    >
      <LoaderIcon
        width={size}
        height={size}
        className="animate-spin text-wakil-text-secondary"
      />
      {text && <p className="text-sm text-wakil-text-tertiary">{text}</p>}
    </div>
  );
};
