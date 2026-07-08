import type { ReactNode } from "react";

export type PadDef = {
  /** 0..15 visual position (row-major top-left) */
  index: number;
  label: string;
  sub?: string;
  /** MIDI note for bank A */
  note: number;
  /** CSS color */
  color: string;
};

export type PadProps = {
  pad: PadDef;
  pressed: boolean;
  onDown: () => void;
  onUp: () => void;
  onHover?: (color: string | null) => void;
  neutral?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  highlighted?: boolean;
};
