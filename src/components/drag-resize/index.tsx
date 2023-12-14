import { useMemoizedFn } from "ahooks";
import { observer } from "mobx-react-lite";
import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AutoScroller from "./AutoScroller";

interface Size {}
interface DragResizeProps extends React.HTMLProps<HTMLDivElement> {
  // onResize: (event: SyntheticEvent<HTMLDivElement, Event>) => void
  onResizeStart: ({ width, x }: { width: number; x: number }) => void;
  /* Before dragging size */
  onResizeEnd?: ({ width, x }: { width: number; x: number }) => void;
  onBeforeResize?: () => void;
  minWidth?: number;
  type: "left" | "right" | "move";
  grid?: number;
  scroller?: HTMLElement;
  defaultSize: {
    width: number;
    x: number;
  };
  autoScroll?: boolean;
  onAutoScroll?: (delta: number) => void;
  reachEdge?: (position: "left" | "right") => boolean;
  /* Click to start */
  clickStart?: boolean;
  disabled?: boolean;
}
const snap = (n: number, size: number): number => Math.round(n / size) * size;
const DragResize: React.FC<DragResizeProps> = ({
  type,
  onBeforeResize,
  onResizeStart,
  onResizeEnd,
  minWidth = 0,
  grid,
  defaultSize: { x: defaultX, width: defaultWidth },
  scroller,
  autoScroll: enableAutoScroll = true,
  onAutoScroll,
  reachEdge = () => false,
  clickStart = false,
  children,
  disabled = false,
  ...otherProps
}) => {
  const [resizing, setResizing] = useState(false);
  const handleAutoScroll = useMemoizedFn((delta: number) => {
    updateSize();
    onAutoScroll(delta);
  });
  // TODO persist reachEdge
  const autoScroll = useMemo(
    () =>
      new AutoScroller({ scroller, onAutoScroll: handleAutoScroll, reachEdge }),
    [handleAutoScroll, scroller, reachEdge]
  );
  const positionRef = useRef({
    clientX: 0,
    width: defaultWidth,
    x: defaultX,
  });
  const moveRef = useRef({
    clientX: 0,
  });
  const updateSize = useMemoizedFn(() => {
    if (disabled) return;
    const distance =
      moveRef.current.clientX -
      positionRef.current.clientX +
      autoScroll.autoScrollPos;
    switch (type) {
      case "left": {
        let width = positionRef.current.width - distance;
        if (minWidth !== undefined) {
          width = Math.max(width, minWidth);
        }
        if (grid) {
          width = snap(width, grid);
        }
        const pos = width - positionRef.current.width;
        const x = positionRef.current.x - pos;
        onResizeStart({ width, x });
        break;
      }
      // To the right, x remains unchanged, only the width changes
      case "right": {
        let width = positionRef.current.width + distance;
        if (minWidth !== undefined) {
          width = Math.max(width, minWidth);
        }
        if (grid) {
          width = snap(width, grid);
        }
        const { x } = positionRef.current;
        onResizeStart({ width, x });
        break;
      }
      case "move": {
        const { width } = positionRef.current;
        let rightDistance = distance;
        if (grid) {
          rightDistance = snap(distance, grid);
        }
        const x = positionRef.current.x + rightDistance;
        onResizeStart({ width, x });
        break;
      }
    }
  });
  const handleMouseMove = useMemoizedFn((event: MouseEvent) => {
    if (disabled) return;
    if (!resizing) {
      setResizing(true);
      if (!clickStart) {
        onBeforeResize && onBeforeResize();
      }
    }
    moveRef.current.clientX = event.clientX;
    updateSize();
  });

  const handleMouseUp = useMemoizedFn(() => {
    if (disabled) return;
    autoScroll.stop();
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    if (resizing) {
      setResizing(false);
      onResizeEnd &&
        onResizeEnd({
          x: positionRef.current.x,
          width: positionRef.current.width,
        });
    }
  });
  const handleMouseDown = useMemoizedFn(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (disabled) return;
      event.stopPropagation();
      if (enableAutoScroll && scroller) {
        autoScroll.start();
      }
      if (clickStart) {
        onBeforeResize && onBeforeResize();
        setResizing(true);
      }
      positionRef.current.clientX = event.clientX;
      positionRef.current.x = defaultX;
      positionRef.current.width = defaultWidth;
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
  );

  return (
    <div role="none" onMouseDown={handleMouseDown} {...otherProps}>
      {resizing &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              zIndex: 9999,
              cursor: disabled ? "not-allowed" : "col-resize",
            }}
          />,
          document.body
        )}
      {children}
    </div>
  );
};
export default observer(DragResize);
