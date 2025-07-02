import { DragEventType, PointType } from "../types";
import { useAtom } from "jotai";
import {
  CameraAtom,
  DragSelectBoxAtom,
  SelectedBlockIdsAtom,
  StateRefAtom,
} from "../atoms";
import { screenToCanvas } from "../Camera";
import { blockIntersectBlocks } from "../utils";

const dragStateRef = {
  startPoint: { x: 0, y: 0 },
  startCanvasPoint: { x: 0, y: 0 },
  currentPoint: { x: 0, y: 0 },
  currentCanvasPoint: { x: 0, y: 0 },
};

export function useHandleDragSelect() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setDragSelectBox] = useAtom(DragSelectBoxAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);

  const handleDragSelect = (dragEvent: DragEventType) => {
    if (dragEvent.type === "first") {
      // Set the start point
      dragStateRef.startPoint = {
        x: dragEvent.event.clientX,
        y: dragEvent.event.clientY,
      };
      const startCanvasPoint = screenToCanvas(
        dragStateRef.startPoint,
        stateRef.camera,
        stateRef.zoomContainer!,
      );
      dragStateRef.startCanvasPoint = startCanvasPoint;
    }

    // Update the current point
    dragStateRef.currentPoint = {
      x: dragEvent.event.clientX,
      y: dragEvent.event.clientY,
    };
    const currentCanvasPoint = screenToCanvas(
      dragStateRef.currentPoint,
      stateRef.camera,
      stateRef.zoomContainer!,
    );
    dragStateRef.currentCanvasPoint = currentCanvasPoint;

    const minX = Math.min(
      dragStateRef.startCanvasPoint.x,
      dragStateRef.currentCanvasPoint.x,
    );
    const minY = Math.min(
      dragStateRef.startCanvasPoint.y,
      dragStateRef.currentCanvasPoint.y,
    );
    const width = Math.abs(
      dragStateRef.startCanvasPoint.x - dragStateRef.currentCanvasPoint.x,
    );
    const height = Math.abs(
      dragStateRef.startCanvasPoint.y - dragStateRef.currentCanvasPoint.y,
    );
    const dragSelectBox = {
      x: minX,
      y: minY,
      width,
      height,
    };

    setDragSelectBox(dragSelectBox);
    const blocks = stateRef.blockIds.map((id) => stateRef.blockMap[id]);

    const intersectedBlocks = blockIntersectBlocks(dragSelectBox, blocks);
    setSelectedBlockIds(intersectedBlocks.map((block) => block.id));

    if (dragEvent.type === "last") {
      setDragSelectBox(null);
    }
  };

  return handleDragSelect;
}

export function DragSelectBox() {
  const [dragSelectBox] = useAtom(DragSelectBoxAtom);
  const [camera] = useAtom(CameraAtom);
  const borderWidth = Math.max(2 / camera.z, 2);

  if (!dragSelectBox) {
    return null;
  }

  return (
    <div
      className="border-neutral-400 absolute"
      style={{
        borderWidth: borderWidth,
        left: dragSelectBox.x - borderWidth / 2,
        top: dragSelectBox.y - borderWidth / 2,
        width: dragSelectBox.width + borderWidth,
        height: dragSelectBox.height + borderWidth,
      }}
    />
  );
}
