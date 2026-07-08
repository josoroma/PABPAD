import type { TABS } from "./constants";

export type HelpModalProps = { open: boolean; onClose: () => void };

export type TabId = (typeof TABS)[number]["id"];
