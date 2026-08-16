"use client";

import dynamic from "next/dynamic";

// Client-only: the playground trains models and renders canvas/SVG from
// floating-point math that can differ by a ULP between server (Node) and
// browser JS engines, which would otherwise cause hydration mismatches for
// no benefit — there is nothing meaningful to server-render here.
// `ssr: false` requires a Client Component boundary, hence this wrapper.
export const ClassicalMlPlayground = dynamic(
  () => import("./ClassicalMlPlayground").then((m) => m.ClassicalMlPlayground),
  { ssr: false }
);
