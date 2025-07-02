import { useAtom } from "jotai";
import { DragEventType } from "../types";
import {
  BlockIdsAtom,
  BlockMapAtom,
  RedoStackAtom,
  SelectedBlockIdsAtom,
  StateRefAtom,
  UndoStackAtom,
} from "../atoms";
import { screenToCanvas } from "../Camera";
import { makeZIndex } from "../utils";

const dragStateRef = {
  startCanvasPoint: { x: 0, y: 0 },
  currentCanvasPoint: { x: 0, y: 0 },
  startBlockPoints: [] as { x: number; y: number }[],
  undoState: {} as any,
  redoState: {} as any,
};

export function useHandleSelectedBoxDrag() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [, setUndoStack] = useAtom(UndoStackAtom);
  const [, setRedoStack] = useAtom(RedoStackAtom);

  return function handleSelectedBoxDrag(dragEvent: DragEventType) {
    const canvasPoint = screenToCanvas(
      { x: dragEvent.event.clientX, y: dragEvent.event.clientY },
      stateRef.camera,
      stateRef.zoomContainer!,
    );

    if (dragEvent.type === "first") {
      dragEvent.targetEl.style.cursor = "grabbing";
      dragStateRef.startCanvasPoint = canvasPoint;

      const sortedSelectedBlockIds = [...stateRef.selectedBlockIds].sort(
        (a, b) => {
          const blockA = stateRef.blockMap[a];
          const blockB = stateRef.blockMap[b];
          console.log(blockA.zIndex, blockB.zIndex);
          return blockA.zIndex - blockB.zIndex;
        },
      );
      // keep order
      stateRef.selectedBlockIds = sortedSelectedBlockIds;
      setSelectedBlockIds(sortedSelectedBlockIds);

      dragStateRef.startBlockPoints = stateRef.selectedBlockIds.map(
        (blockId) => {
          const block = stateRef.blockMap[blockId];
          return { x: block.x, y: block.y };
        },
      );
      dragStateRef.undoState = {
        blockMap: JSON.parse(JSON.stringify(stateRef.blockMap)),
        blockIds: [...stateRef.blockIds],
        selectedBlockIds: [...stateRef.selectedBlockIds],
      };

      if (dragEvent.event.altKey) {
        let newIds = [];
        const newBlockMap = { ...stateRef.blockMap };
        const newZIndex = makeZIndex();
        let i = 0;
        if (dragEvent.event.shiftKey) {
          for (const blockId of stateRef.selectedBlockIds) {
            const newId = crypto.randomUUID();
            newIds.push(newId);
            const block = stateRef.blockMap[blockId];

            // async image creation
            const canvas = document.createElement("canvas");
            const activeStream = stateRef.activeStreams[block.src!];
            canvas.width = activeStream!.videoSize!.width;
            canvas.height = activeStream!.videoSize!.height;
            const ctx = canvas.getContext("2d")!;
            if (block.flippedHorizontally) {
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
            }
            if (block.flippedVertically) {
              ctx.translate(0, canvas.height);
              ctx.scale(1, -1);
            }
            ctx.drawImage(
              activeStream!.refs.video!,
              0,
              0,
              canvas.width,
              canvas.height,
            );

            if (block.type === "webcam") {
              newBlockMap[newId] = {
                ...block,
                type: "image",
                srcType: "canvas",
                canvas: canvas,
                id: newId,
                x: block.x,
                y: block.y,
                zIndex: newZIndex + i,
              };
            } else {
              newBlockMap[newId] = {
                ...block,
                id: newId,
                x: block.x,
                y: block.y,
                zIndex: newZIndex + i,
              };
            }
            i++;
          }
        } else {
          for (const blockId of stateRef.selectedBlockIds) {
            const newId = crypto.randomUUID();
            newIds.push(newId);
            const block = stateRef.blockMap[blockId];
            newBlockMap[newId] = {
              ...block,
              id: newId,
              zIndex: newZIndex + i,
            };
            i++;
          }
        }
        stateRef.blockMap = newBlockMap;
        setBlockMap(stateRef.blockMap);
        stateRef.blockIds = [...stateRef.blockIds, ...newIds];
        setBlockIds(stateRef.blockIds);
        stateRef.selectedBlockIds = newIds;
        setSelectedBlockIds(newIds);
      }
    }

    dragStateRef.currentCanvasPoint = canvasPoint;

    const deltaX =
      dragStateRef.currentCanvasPoint.x - dragStateRef.startCanvasPoint.x;
    const deltaY =
      dragStateRef.currentCanvasPoint.y - dragStateRef.startCanvasPoint.y;

    const newBlockPositions = dragStateRef.startBlockPoints.map((point) => ({
      x: point.x + deltaX,
      y: point.y + deltaY,
    }));

    const newBlockMap = { ...stateRef.blockMap };
    const newZIndex = makeZIndex();
    stateRef.selectedBlockIds.forEach((blockId, index) => {
      const block = stateRef.blockMap[blockId];
      newBlockMap[blockId] = {
        ...block,
        x: newBlockPositions[index].x,
        y: newBlockPositions[index].y,
        zIndex: newZIndex + index,
      };
    });

    stateRef.blockMap = newBlockMap;
    setBlockMap(stateRef.blockMap);

    if (dragEvent.type === "last") {
      dragEvent.targetEl.style.cursor = "";
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
