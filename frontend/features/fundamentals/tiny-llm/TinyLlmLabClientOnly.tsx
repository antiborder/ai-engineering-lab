"use client";

import dynamic from "next/dynamic";

// Client-only: this lab talks to the backend API for real training/
// generation, which can't run during static/server rendering anyway (no
// backend guaranteed to be reachable at build time), and would otherwise
// hydration-mismatch on top of that.
export const TinyLlmLab = dynamic(() => import("./TinyLlmLab").then((m) => m.TinyLlmLab), {
  ssr: false,
});
