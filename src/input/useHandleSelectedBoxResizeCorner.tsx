import { useAtom } from "jotai";
import { BoxType, DragEventType } from "../types";
import {
  BlockIdsAtom,
  BlockMapAtom,
  RedoStackAtom,
  SelectedBlockIdsAtom,
  StateRefAtom,
  UndoStackAtom,
} from "../atoms";
import { screenToCanvas } from "../Camera";
import { getBoxBoundsFromBlocks } from "../utils";
import { minBlockSize } from "../consts";

const dragStateRef = {
  startCanvasPoint: { x: 0, y: 0 },
  currentCanvasPoint: { x: 0, y: 0 },
  startBlockBoxes: [] as BoxType[],
  startBox: { x: 0, y: 0, width: 0, height: 0 },
  offset: { x: 0, y: 0 },
  undoState: {} as any,
  redoState: {} as any,
};

export function useHandleSelectedBoxResizeCorner() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setUndoStack] = useAtom(UndoStackAtom);
  const [, setRedoStack] = useAtom(RedoStackAtom);

  return function handleSelectedBoxResizeCorner(dragEvent: DragEventType) {
    const corner = dragEvent.targetEl
      .getAttribute("data-target")!
      .replace("resize-corner-", "");

    const canvasPoint = screenToCanvas(
      { x: dragEvent.event.clientX, y: dragEvent.event.clientY },
      stateRef.camera,
      stateRef.zoomContainer!,
    );

    if (dragEvent.type === "first") {
      dragStateRef.startCanvasPoint = canvasPoint;
      dragStateRef.startBlockBoxes = stateRef.selectedBlockIds.map(
        (blockId) => {
          const block = stateRef.blockMap[blockId];
          return {
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
          };
        },
      );
      dragStateRef.startBox = getBoxBoundsFromBlocks(
        stateRef.selectedBlockIds.map((blockId) => stateRef.blockMap[blockId]),
      );
      dragStateRef.undoState = {
        blockMap: JSON.parse(JSON.stringify(stateRef.blockMap)),
        blockIds: [...stateRef.blockIds],
        selectedBlockIds: [...stateRef.selectedBlockIds],
      };
      if (corner === "top-left") {
        dragStateRef.offset = {
          x: canvasPoint.x - dragStateRef.startBox.x,
          y: canvasPoint.y - dragStateRef.startBox.y,
        };
      } else if (corner === "top-right") {
        dragStateRef.offset = {
          x:
            canvasPoint.x -
            (dragStateRef.startBox.x + dragStateRef.startBox.width),
          y: canvasPoint.y - dragStateRef.startBox.y,
        };
      } else if (corner === "bottom-left") {
        dragStateRef.offset = {
          x: canvasPoint.x - dragStateRef.startBox.x,
          y:
            canvasPoint.y -
            (dragStateRef.startBox.y + dragStateRef.startBox.height),
        };
      } else if (corner === "bottom-right") {
        dragStateRef.offset = {
          x:
            canvasPoint.x -
            (dragStateRef.startBox.x + dragStateRef.startBox.width),
          y:
            canvasPoint.y -
            (dragStateRef.startBox.y + dragStateRef.startBox.height),
        };
      }
    }

    dragStateRef.currentCanvasPoint = canvasPoint;
    const currentPoint = {
      x: dragStateRef.currentCanvasPoint.x - dragStateRef.offset.x,
      y: dragStateRef.currentCanvasPoint.y - dragStateRef.offset.y,
    };

    const startBox = dragStateRef.startBox;
    let newStartBox = { ...startBox };
    if (corner === "top-left") {
      const limitedX = Math.min(
        currentPoint.x,
        startBox.x + startBox.width - minBlockSize,
      );
      const limitedY = Math.min(
        currentPoint.y,
        startBox.y + startBox.height - minBlockSize,
      );
      let newWidth = startBox.x + startBox.width - limitedX;
      let newHeight = startBox.y + startBox.height - limitedY;
      const scaleWidth = newWidth / startBox.width;
      const scaleHeight = newHeight / startBox.height;
      const scale = Math.max(scaleWidth, scaleHeight);
      newWidth = startBox.width * scale;
      newHeight = startBox.height * scale;
      newStartBox = {
        x: startBox.x + (startBox.width - newWidth),
        y: startBox.y + (startBox.height - newHeight),
        width: newWidth,
        height: newHeight,
      };
    } else if (corner === "top-right") {
      const limitedY = Math.min(
        currentPoint.y,
        startBox.y + startBox.height - minBlockSize,
      );
      let newWidth = Math.max(
        currentPoint.x - startBox.x,
        minBlockSize,
      );
      let newHeight = startBox.y + startBox.height - limitedY;
      const scaleWidth = newWidth / startBox.width;
      const scaleHeight = newHeight / startBox.height;
      const scale = Math.max(scaleWidth, scaleHeight);
      newWidth = startBox.width * scale;
      newHeight = startBox.height * scale;
      newStartBox = {
        x: startBox.x, 
        y: startBox.y + (startBox.height - newHeight),
        width: newWidth,
        height: newHeight,
      };
    } else if (corner === "bottom-left") {
      const limitedX = Math.min(
        currentPoint.x,
        startBox.x + startBox.width - minBlockSize,
      );
      let newWidth = startBox.x + startBox.width - limitedX;
      let newHeight = Math.max(
        currentPoint.y - startBox.y,
        minBlockSize,
      );
      const scaleWidth = newWidth / startBox.width;
      const scaleHeight = newHeight / startBox.height;
      const scale = Math.max(scaleWidth, scaleHeight);
      newWidth = startBox.width * scale;
      newHeight = startBox.height * scale;
      newStartBox = {
        x: startBox.x + (startBox.width - newWidth),
        y: startBox.y,
        width: newWidth,
        height: newHeight,
      };
    } else if (corner === "bottom-right") {
      let newWidth = Math.max(
        currentPoint.x - startBox.x,
        minBlockSize,
      );
      let newHeight = Math.max(
        currentPoint.y - startBox.y,
        minBlockSize,
      );
      const scaleWidth = newWidth / startBox.width;
      const scaleHeight = newHeight / startBox.height;
      const scale = Math.max(scaleWidth, scaleHeight);
      newWidth = startBox.width * scale;
      newHeight = startBox.height * scale;
      newStartBox = {
        x: startBox.x,
        y: startBox.y,
        width: newWidth,
        height: newHeight,
      };
    }

    const newBlockBoxes = dragStateRef.startBlockBoxes.map((blockBox) => {
      const ratioMinX = (blockBox.x - startBox.x) / startBox.width;
      const ratioMinY = (blockBox.y - startBox.y) / startBox.height;
      const ratioMaxX =
        (blockBox.x + blockBox.width - startBox.x) / startBox.width;
      const ratioMaxY =
        (blockBox.y + blockBox.height - startBox.y) / startBox.height;
      return {
        x: newStartBox.x + ratioMinX * newStartBox.width,
        y: newStartBox.y + ratioMinY * newStartBox.height,
        width: (ratioMaxX - ratioMinX) * newStartBox.width,
        height: (ratioMaxY - ratioMinY) * newStartBox.height,
      };
    });

    const newBlockMap = { ...stateRef.blockMap };
    stateRef.selectedBlockIds.forEach((blockId, index) => {
      const block = stateRef.blockMap[blockId];
      newBlockMap[blockId] = {
        ...block,
        ...newBlockBoxes[index],
      };
    });

    stateRef.blockMap = newBlockMap;
    setBlockMap(stateRef.blockMap);

    if (dragEvent.type === "last") {
      const redoState = {
        blockMap: JSON.parse(JSON.stringify(newBlockMap)),
        blockIds: [...stateRef.blockIds],
        selectedBlockIds: [...stateRef.selectedBlockIds],
      };
      setUndoStack((prev) => [
        ...prev,
        {
          undo: {
            blockMap: dragStateRef.undoState.blockMap,
            blockIds: dragStateRef.undoState.blockIds,
            selectedBlockIds: dragStateRef.undoState.selectedBlockIds,
          },
          redo: {
            blockMap: redoState.blockMap,
            blockIds: redoState.blockIds,
            selectedBlockIds: redoState.selectedBlockIds,
          },
        },
      ]);
      setRedoStack([]);
    }
  };
}
