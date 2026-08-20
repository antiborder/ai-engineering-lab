import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumb trail (spec section 4) — always shows where the user is,
 * and (on artifact pages) which AI artifact they're working with. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "AI Engineering Lab", href: "/" }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 mb-4">
      <ol className="flex flex-wrap items-center gap-1">
        {all.map((crumb, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="text-neutral-600">/</span>}
            <li>
              {crumb.href && i < all.length - 1 ? (
                <Link href={crumb.href} className="hover:text-neutral-900 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-neutral-800">{crumb.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
