import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "CareerPilot AI",
  description: "AI Job Search, Scholarship & Family Relocation Assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f6f7fb]">
        <div className="flex min-h-screen">
          <Nav />
          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[1400px] px-6 py-7 lg:px-10">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
