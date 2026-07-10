import { useState, useEffect } from "react";

const ZOOM_KEY = "pc_zoom";

export function useZoom() {
  const [zoom, setZoom] = useState<number>(() => {
    try {
      return parseFloat(localStorage.getItem(ZOOM_KEY) || "1");
    } catch {
      return 1;
    }
  });

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      e.stopPropagation();
      setZoom((prev) => {
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const next = Math.max(0.75, Math.min(1.5, prev + delta));
        localStorage.setItem(ZOOM_KEY, next.toString());
        return next;
      });
    };
    window.addEventListener("wheel", handler, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", handler, { capture: true });
  }, []);

  return zoom;
}