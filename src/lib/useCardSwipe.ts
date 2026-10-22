import { useRef, type MouseEvent, type PointerEvent } from 'react';

// Leave vertical scrolling and pinch zoom to the browser. A deliberate horizontal
// touch moves one card; taps, mouse selection, and interrupted gestures do not.
export function useCardSwipe(onSwipe: (delta: number) => void) {
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      suppressClick.current = false;
      if (event.pointerType !== 'touch' || !event.isPrimary) {
        gesture.current = null;
        return;
      }
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const start = gesture.current;
      if (!start || start.id !== event.pointerId) return;
      const dx = Math.abs(event.clientX - start.x);
      const dy = Math.abs(event.clientY - start.y);
      if (dy > 12 && dy >= dx) gesture.current = null;
      if (dx > 12 && dx > dy * 1.5) suppressClick.current = true;
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const start = gesture.current;
      gesture.current = null;
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        suppressClick.current = true;
        onSwipe(dx < 0 ? 1 : -1);
      }
    },
    onPointerCancel() {
      gesture.current = null;
      suppressClick.current = false;
    },
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (suppressClick.current && event.detail > 0) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
      }
    },
  };
}
