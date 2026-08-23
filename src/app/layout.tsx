import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Show IT · CampusCup", description: "Live CampusCup heat progress" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
