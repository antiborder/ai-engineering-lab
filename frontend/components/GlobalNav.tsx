"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";

export function GlobalNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 flex items-center gap-3 sm:gap-6 h-14">
        <Link
          href="/"
          className="font-semibold text-xs sm:text-sm text-neutral-900 shrink-0 whitespace-nowrap"
        >
          AI Engineering Lab
        </Link>
        <nav className="flex gap-1 overflow-x-auto min-w-0">
          {MODULES.map((module) => {
            const isActive = pathname === `/${module.slug}` || pathname.startsWith(`/${module.slug}/`);
            return (
              <Link
                key={module.id}
                href={`/${module.slug}`}
                className={`px-3 py-2 sm:py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
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
