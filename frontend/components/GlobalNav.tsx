"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";

export function GlobalNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-800 bg-neutral-950 sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 flex items-center gap-6 h-14">
        <Link href="/" className="font-semibold text-sm text-neutral-100 shrink-0">
          AI Engineering Lab
        </Link>
        <nav className="flex gap-1 overflow-x-auto">
          {MODULES.map((module) => {
            const isActive = pathname === `/${module.slug}` || pathname.startsWith(`/${module.slug}/`);
            return (
              <Link
                key={module.id}
                href={`/${module.slug}`}
                className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900"
                }`}
              >
                {module.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
