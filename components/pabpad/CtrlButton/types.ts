import type { MouseEvent } from "react";

export type CtrlButtonProps = {
  label: string;
  sub?: string;
  color?: string;
  active?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
};
