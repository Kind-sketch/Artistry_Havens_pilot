
'use client';

import SponsorSidebar from "@/components/sponsor-sidebar";
import { usePathname } from "next/navigation";

export default function SponsorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const noSidebarRoutes = ['/sponsor/register']; // Example if you add more pages without the nav

  if (noSidebarRoutes.includes(pathname)) {
    return <main className="h-full overflow-y-auto">{children}</main>;
  }

  return (
    <div className="flex flex-col h-screen w-full">
      <SponsorSidebar />
      <main className="flex-1 bg-secondary/30 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
