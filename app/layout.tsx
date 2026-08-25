import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alpha AI",
  description: "AI receptionist and lead management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-screen flex flex-col">
            <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
              <div className="container flex h-16 items-center justify-between">
                <span className="font-bold text-xl">Alpha AI</span>
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 container py-6">{children}</main>
            <footer className="border-t py-4 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Alpha AI – All rights reserved.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}