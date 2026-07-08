import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PabPad — Modern Web Pad",
  description:
    "PabPad: a modern, web-based 16 RGB pad controller with dual knobs, dual faders, and a built-in preview synth.",
};

export const viewport: Viewport = {
  themeColor: "#ff3b30",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster theme="dark" richColors position="top-center" />
      </body>
    </html>
  );
}
