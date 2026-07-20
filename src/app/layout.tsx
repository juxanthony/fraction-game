import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

export const metadata: Metadata = {
  title: "Fraction Tug of War | 分数拔河大赛",
  description:
    "An educational tug-of-war mathematics game for Malaysian SJKC Year 5 pupils — master fractions through play. Aligned to the KSSR Mathematics syllabus.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen antialiased">
        <AnimatedBackground />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
