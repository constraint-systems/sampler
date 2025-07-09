import { useAtom } from "jotai";
import {
  SelectedBlockIdsAtom,
  ShowBlockMenuAtom,
  showCropModalAtom,
  StateRefAtom,
} from "../atoms";
import { DragEventType } from "../types";
import { useHandleWheel } from "./useHandleWheel";
import { useEffect, useRef } from "react";
import { useHandleDragSelect } from "./useHandleDragSelect";
import { useHandleBlockDrag } from "./useHandleBlockDrag";
import { useHandleSelectedBoxResizeSide } from "./useHandleSelectedBoxResizeSide";
import { useHandleSelectedBoxResizeCorner } from "./useHandleSelectedBoxResizeCorner";
import { useHandleBlockCropDrag } from "./useHandleBlockCropDrag";
import { useHandleSelectedBoxResizeCropSide } from "./useHandleSelectedBoxResizeCropSide";
import { useHandleSelectedBoxResizeCropCorner } from "./useHandleSelectedBoxResizeCropCorner";

export function useHandlePointerEvents() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [, setShowCropModal] = useAtom(showCropModalAtom);
  const [, setShowBlockMenu] = useAtom(ShowBlockMenuAtom);
  const handleWheel = useHandleWheel();
  const handleDragSelect = useHandleDragSelect();
  const handleBlockDrag = useHandleBlockDrag();
  const handleBlockCropDrag = useHandleBlockCropDrag();
  const handleSelectedBoxResizeSide = useHandleSelectedBoxResizeSide();
  const handleSelectedBoxResizeCorner = useHandleSelectedBoxResizeCorner();
  const handleSelectedBoxResizeCropSide = useHandleSelectedBoxResizeCropSide();
  const handleSelectedBoxResizeCropCorner =
    useHandleSelectedBoxResizeCropCorner();

  const startedAsControlRef = useRef(false);

  const blockDoubleClickRefCheck = useRef(["block", 0] as [string, number]);
  const handleDrag = (dragEvent: DragEventType) => {
    const targetEl = (dragEvent.event.target as HTMLElement).closest(".active");
    if (targetEl) {
      const dataTarget = targetEl.getAttribute("data-target")!;
      const numberOfActivePointers = stateRef.activePointers.size;
      if (dragEvent.type === "first") {
        if (dragEvent.event.ctrlKey) {
          startedAsControlRef.current = true;
        } else {
          startedAsControlRef.current = false;
        }
      }
      if (numberOfActivePointers > 1) {
      } else {
        if (dataTarget === "tool-button") {
          return;
        }
        if (dataTarget === "zoom-container") {
          handleDragSelect(dragEvent);
        } else if (dataTarget.startsWith("resize-corner-")) {
          if (
            startedAsControlRef.current &&
            stateRef.selectedBlockIds.length === 1
          ) {
            handleSelectedBoxResizeCropCorner(dragEvent);
          } else {
            handleSelectedBoxResizeCorner(dragEvent);
          }
        } else if (dataTarget.startsWith("resize-side-")) {
          if (
            startedAsControlRef.current &&
            stateRef.selectedBlockIds.length === 1
          ) {
            handleSelectedBoxResizeCropSide(dragEvent);
          } else {
            handleSelectedBoxResizeSide(dragEvent);
          }
        } else if (dataTarget.startsWith("block-")) {
          if (dragEvent.type === "first") {
            if (
              blockDoubleClickRefCheck.current[0] === dataTarget &&
              performance.now() - blockDoubleClickRefCheck.current[1] < 300
            ) {
              const blockId = dataTarget.replace("block-", "");
              stateRef.selectedBlockIds = [blockId];
              setSelectedBlockIds([blockId]);
              setShowCropModal(true);
            }
            blockDoubleClickRefCheck.current = [dataTarget, performance.now()];
          }
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
    if (event.button !== 0) {
      // handle right click
      if (event.button === 2) {
        event.preventDefault(); // Prevent context menu
        if (stateRef.selectedBlockIds.length > 0) {
          // If right-clicking on a selected block, deselect it
          setShowBlockMenu(true);
        }
      }
      // Ignore non-primary button clicks
      return;
    }
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
