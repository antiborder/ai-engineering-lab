"use client";

import { useCallback, useRef, useState } from "react";

export interface DragRotateState {
  /** Rotation around the vertical axis, radians. */
  yaw: number;
  /** Camera tilt above the floor plane, radians (clamped so the view never
   * flips upside down or goes perfectly flat). */
  pitch: number;
}

const PITCH_MIN = 0.15;
const PITCH_MAX = 1.3;

/** Pointer-driven drag-to-rotate for the app's hand-rolled 3D canvases
 * (MSELandscape, ProbabilitySurface3D, and similar). Uses the Pointer
 * Events API so the same handlers work for mouse drag and touch drag with
 * no separate touch-event code — required for this to work on a phone.
 * Returns the current rotation plus a `bind` object of DOM event handlers
 * to spread onto the canvas element, and a `reset` to restore the default
 * view (the "undo" affordance for this particular interaction). */
export function useDragRotate(defaultYaw: number, defaultPitch: number) {
  const [state, setState] = useState<DragRotateState>({ yaw: defaultYaw, pitch: defaultPitch });
  const dragRef = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, yaw: state.yaw, pitch: state.pitch };
  }, [state]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const start = dragRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    setState({
      yaw: start.yaw + dx * 0.012,
      pitch: Math.min(PITCH_MAX, Math.max(PITCH_MIN, start.pitch - dy * 0.012)),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setState({ yaw: defaultYaw, pitch: defaultPitch });
  }, [defaultYaw, defaultPitch]);

  return {
    yaw: state.yaw,
    pitch: state.pitch,
    isDefault: state.yaw === defaultYaw && state.pitch === defaultPitch,
    reset,
    bind: { onPointerDown, onPointerMove, onPointerUp, onPointerLeave: onPointerUp },
  };
}
