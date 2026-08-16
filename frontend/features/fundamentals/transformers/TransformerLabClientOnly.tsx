"use client";

import dynamic from "next/dynamic";

// Client-only for the same reason as the other Fundamentals labs: all
// computation happens in the browser and floating-point differences
// between server and client renders would otherwise cause hydration
// mismatches for no benefit.
export const TransformerLab = dynamic(
  () => import("./TransformerLab").then((m) => m.TransformerLab),
  { ssr: false }
);
