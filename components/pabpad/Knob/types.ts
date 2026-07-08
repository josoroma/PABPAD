export type KnobProps = {
  label: string;
  /** 0..127 */
  value: number;
  onChange: (v: number) => void;
  color?: string;
};
