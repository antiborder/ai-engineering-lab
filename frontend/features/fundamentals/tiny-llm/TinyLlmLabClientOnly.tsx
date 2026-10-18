"use client";

import dynamic from "next/dynamic";

// Client-only: this lab trains a real model with TensorFlow.js, which needs
// the browser's WebGL/CPU backends and can't run during static rendering —
// and would otherwise hydration-mismatch on top of that. Loading it this
// way also keeps TensorFlow.js out of every other page's bundle.
export const TinyLlmLab = dynamic(() => import("./TinyLlmLab").then((m) => m.TinyLlmLab), {
  ssr: false,
});
