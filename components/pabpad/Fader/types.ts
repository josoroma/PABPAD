export type FaderProps = {
  label: string;
  /** 0..127 */
  value: number;
  onChange: (v: number) => void;
};
