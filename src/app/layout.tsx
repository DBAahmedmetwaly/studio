
import type { Metadata } from "next";
import { Inter, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/app/app-layout";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { PermissionsProvider } from "@/contexts/permissions-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-kufi-arabic",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "المحاسب الذكي",
  description: "نظام المخازن والمحاسبة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoKufi.variable} font-headline antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="neutral"
          enableSystem
          disableTransitionOnChange
        >
          <PermissionsProvider>
            <AppLayout>{children}</AppLayout>
          </PermissionsProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
