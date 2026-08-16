"use client";

import dynamic from "next/dynamic";

// Client-only for the same reason as the classical-ml playground: training
// runs entirely in the browser and floating-point SVG/canvas output can
// differ by a ULP between server and client, which would otherwise cause
// hydration mismatches for no benefit.
export const NeuralNetworkLab = dynamic(
  () => import("./NeuralNetworkLab").then((m) => m.NeuralNetworkLab),
  { ssr: false }
);
