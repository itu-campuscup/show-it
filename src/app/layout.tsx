import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Show IT | CampusCup spectator command centre",
  description: "Follow the current CampusCup heat from the published spectator snapshot.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
