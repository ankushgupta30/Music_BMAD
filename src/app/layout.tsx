import type { Metadata } from "next";
import { displayFont, metaFont, handFont } from "@/styles/fonts";
import RouteAnnouncer from "@/components/shared/RouteAnnouncer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rewind",
  description: "A personal typographic music journal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${metaFont.variable} ${handFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <RouteAnnouncer />
        {children}
      </body>
    </html>
  );
}
