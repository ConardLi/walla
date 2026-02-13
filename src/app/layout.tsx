import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthMethodDialog } from "@/components/auth/auth-method-dialog";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACP Desktop",
  description: "Agent Client Protocol Desktop Client",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased overflow-hidden h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
          <AuthMethodDialog />
        </ThemeProvider>
      </body>
    </html>
  );
}
