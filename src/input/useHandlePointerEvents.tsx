import { useAtom } from "jotai";
import { StateRefAtom } from "../atoms";
import { DragEventType } from "../types";
import { useHandleWheel } from "./useHandleWheel";
import { useEffect } from "react";
import { useHandleDragSelect } from "./useHandleDragSelect";
import { useHandleBlockDrag } from "./useHandleBlockDrag";
import { useHandleSelectedBoxResizeSide } from "./useHandleSelectedBoxResizeSide";
import { useHandleSelectedBoxResizeCorner } from "./useHandleSelectedBoxResizeCorner";
import { useHandleBlockCropDrag } from "./useHandleBlockCropDrag";
import { useHandleSelectedBoxResizeCropSide } from "./useHandleSelectedBoxResizeCropSide";

export function useHandlePointerEvents() {
  const [stateRef] = useAtom(StateRefAtom);
  const handleWheel = useHandleWheel();
  const handleDragSelect = useHandleDragSelect();
  const handleBlockDrag = useHandleBlockDrag();
  const handleBlockCropDrag = useHandleBlockCropDrag();
  const handleSelectedBoxResizeSide = useHandleSelectedBoxResizeSide();
  const handleSelectedBoxResizeCorner = useHandleSelectedBoxResizeCorner();
  const handleSelectedBoxResizeCropSide = useHandleSelectedBoxResizeCropSide();

  const handleDrag = (dragEvent: DragEventType) => {
    const targetEl = (dragEvent.event.target as HTMLElement).closest(".active");
    if (targetEl) {
      const dataTarget = targetEl.getAttribute("data-target")!;
      const numberOfActivePointers = stateRef.activePointers.size;
      if (numberOfActivePointers > 1) {
      } else {
        if (dataTarget === "zoom-container") {
          handleDragSelect(dragEvent);
        } else if (dataTarget.startsWith("resize-corner-")) {
          handleSelectedBoxResizeCorner(dragEvent);
        } else if (dataTarget.startsWith("resize-side-")) {
          if (dragEvent.event.ctrlKey &&  stateRef.selectedBlockIds.length === 1) {
            handleSelectedBoxResizeCropSide(dragEvent);
          } else {
            handleSelectedBoxResizeSide(dragEvent);
          }
        } else if (dataTarget.startsWith("block-")) {
          if (dragEvent.event.ctrlKey) {
            handleBlockCropDrag(dragEvent);
          } else {
            handleBlockDrag(dragEvent);
          }
        }
      }
    }
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    stateRef.activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    handleDrag({
      id: event.pointerId,
      type: "first",
      event,
      targetEl: event.target as HTMLElement,
    });
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (stateRef.activePointers.has(event.pointerId)) {
      handleDrag({
        id: event.pointerId,
        type: "move",
        event,
        targetEl: event.target as HTMLElement,
      });
    }
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    stateRef.activePointers.delete(event.pointerId);
    handleDrag({
      id: event.pointerId,
      type: "last",
      event,
      targetEl: event.target as HTMLElement,
    });
  };

  // Wheel has to be effect to get non-passive event listener
  useEffect(() => {
    window.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  };
}
