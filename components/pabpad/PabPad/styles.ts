import type { Bank } from "./atoms";

export const PAD_BANK_TEXT_CLASS: Record<Bank, string> = {
  A: "text-[#ff5fc1]",
  B: "text-[#ffd166]",
  C: "text-[#fb7185]",
};

export const TRACK_SELECTED_CLASS = "bg-[#3b6bff]/18 ring-2 ring-[#3b6bff] shadow-[0_0_18px_-8px_#3b6bff]";
export const TRACK_SELECTED_LABEL_CLASS = "bg-[#3b6bff] text-white ring-[#3b6bff]";
export const CLIP_SELECTED_CLASS = "ring-2 ring-[#3b6bff] shadow-[0_0_14px_-5px_#3b6bff]";
