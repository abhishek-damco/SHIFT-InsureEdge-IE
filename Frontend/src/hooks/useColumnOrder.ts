import { useState, type DragEvent } from 'react';

// QA UGM-02 / UM-02: user-defined grid column order — drag a header onto another.
// The order lasts for the visit; it isn't saved.
export function useColumnOrder<K extends string>(initial: K[]) {
  const [order, setOrder] = useState<K[]>(initial);
  const [dragging, setDragging] = useState<K | null>(null);

  const move = (from: K, to: K) => {
    if (from === to) return;
    setOrder(prev => {
      const next = prev.filter(k => k !== from);
      next.splice(next.indexOf(to), 0, from);
      return next;
    });
  };

  // Spread onto each draggable <th>.
  const headerProps = (key: K) => ({
    draggable: true,
    title: 'Drag to reorder',
    onDragStart: (e: DragEvent) => { setDragging(key); e.dataTransfer.effectAllowed = 'move'; },
    onDragOver: (e: DragEvent) => { if (dragging) e.preventDefault(); },
    onDrop: (e: DragEvent) => { e.preventDefault(); if (dragging) move(dragging, key); setDragging(null); },
    onDragEnd: () => setDragging(null),
  });

  return { order, dragging, headerProps };
}
