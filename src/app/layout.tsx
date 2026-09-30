export const runtime = 'edge';

import type { Metadata } from "next";
import Sidebar from "./Sidebar";
import "./globals.css";
import { getAuthSession } from "@/utils/auth";

export const metadata: Metadata = {
  title: "KL-01 Car Spa CRM",
  description: "Enterprise Management Dashboard",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  return (
    <html lang="en">
      <body className="bg-[#F7F9FA] text-gray-900 antialiased font-sans min-h-screen flex flex-col md:flex-row">

        {/* Dynamic Client Sidebar */}
        <Sidebar session={session} />

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}