import type { ReactNode } from "react";
import type { GLOSSARY } from "@/lib/glossary";

/** Inline term marker. Used to link to the Glossary via a tap/click
 * tooltip — that link is cut for now. `id` is kept so a future version can
 * jump straight to the Step that explains this term most thoroughly
 * instead, without touching any of this component's call sites. */
export function Term({ children }: { id: keyof typeof GLOSSARY; children: ReactNode }) {
  return <>{children}</>;
}
