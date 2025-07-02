import { useAtom } from "jotai";
import { BlockType, BoxType, DragEventType } from "../types";
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
  offset: { x: 0, y: 0 },
  startBlock: {} as BlockType,
  undoState: {} as any,
  redoState: {} as any,
};

export function useHandleSelectedBoxResizeCropCorner() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  // TODO implement redo
  const [, setUndoStack] = useAtom(UndoStackAtom);
  const [, setRedoStack] = useAtom(RedoStackAtom);

  return function handleSelectedBoxCornerResize(dragEvent: DragEventType) {
    const corner = dragEvent.targetEl
      .getAttribute("data-target")!
      .replace("resize-corner-", "");
    const block = stateRef.blockMap[stateRef.selectedBlockIds[0]];

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
      dragStateRef.startBlock = block;
      if (!block.crop) {
        dragStateRef.startBlock.crop = {
          x: 0,
          y: 0,
          width: block.originalMediaSize!.width,
          height: block.originalMediaSize!.height,
        };
      }
      dragStateRef.undoState = {
        blockMap: JSON.parse(JSON.stringify(stateRef.blockMap)),
        blockIds: [...stateRef.blockIds],
        selectedBlockIds: [...stateRef.selectedBlockIds],
      };

      if (corner === "top-left") {
        dragStateRef.offset = {
          x: dragStateRef.startCanvasPoint.x - dragStateRef.startBlock.x,
          y: dragStateRef.startCanvasPoint.y - dragStateRef.startBlock.y,
        };
      } else if (corner === "top-right") {
        dragStateRef.offset = {
          x:
            dragStateRef.startCanvasPoint.x -
            (dragStateRef.startBlock.x + dragStateRef.startBlock.width),
          y: dragStateRef.startCanvasPoint.y - dragStateRef.startBlock.y,
        };
      } else if (corner === "bottom-right") {
        dragStateRef.offset = {
          x:
            dragStateRef.startCanvasPoint.x -
            (dragStateRef.startBlock.x + dragStateRef.startBlock.width),
          y:
            dragStateRef.startCanvasPoint.y -
            (dragStateRef.startBlock.y + dragStateRef.startBlock.height),
        };
      } else if (corner === "bottom-left") {
        dragStateRef.offset = {
          x: dragStateRef.startCanvasPoint.x - dragStateRef.startBlock.x,
          y:
            dragStateRef.startCanvasPoint.y -
            (dragStateRef.startBlock.y + dragStateRef.startBlock.height),
        };
      }
    }

    dragStateRef.currentCanvasPoint = canvasPoint;
    const currentPoint = {
      x: dragStateRef.currentCanvasPoint.x - dragStateRef.offset.x,
      y: dragStateRef.currentCanvasPoint.y - dragStateRef.offset.y,
    };

    const startBlock = dragStateRef.startBlock;
    let newBlock = { ...startBlock };
    let newBlockCrop = { ...startBlock.crop } as BoxType | null;

    if (corner === "top-left") {
      const pinnedRightX = startBlock.x + startBlock.width;
      const pinnedBottomY = startBlock.y + startBlock.height;
      const pinnedRightCropX = startBlock.crop!.x + startBlock.crop!.width;
      const pinnedBottomCropY = startBlock.crop!.y + startBlock.crop!.height;

      let proposedWidth = Math.max(pinnedRightX - currentPoint.x, minBlockSize);
      let proposedHeight = Math.max(pinnedBottomY - currentPoint.y, minBlockSize);

      const scaleX = startBlock.crop!.width / startBlock.width;
      const scaleY = startBlock.crop!.height / startBlock.height;
      let proposedCropWidth = proposedWidth * scaleX;
      let proposedCropHeight = proposedHeight * scaleY;

      if (proposedCropWidth > pinnedRightCropX) {
        proposedCropWidth = pinnedRightCropX;
        proposedWidth = proposedCropWidth / scaleX;
      }

      if (proposedCropHeight > pinnedBottomCropY) {
        proposedCropHeight = pinnedBottomCropY;
        proposedHeight = proposedCropHeight / scaleY;
      }

      newBlock.width = proposedWidth;
      newBlock.height = proposedHeight;
      newBlock.x = pinnedRightX - proposedWidth;
      newBlock.y = pinnedBottomY - proposedHeight;
      newBlockCrop!.width = proposedCropWidth;
      newBlockCrop!.height = proposedCropHeight;
      newBlockCrop!.x = pinnedRightCropX - proposedCropWidth;
      newBlockCrop!.y = pinnedBottomCropY - proposedCropHeight;
    } else if (corner === "top-right") {
      const pinnedLeftX = startBlock.x;
      const pinnedBottomY = startBlock.y + startBlock.height;
      const pinnedLeftCropX = startBlock.crop!.x;
      const pinnedBottomCropY = startBlock.crop!.y + startBlock.crop!.height;

      let proposedWidth = Math.max(currentPoint.x - pinnedLeftX, minBlockSize);
      let proposedHeight = Math.max(pinnedBottomY - currentPoint.y, minBlockSize);

      const scaleX = startBlock.crop!.width / startBlock.width;
      const scaleY = startBlock.crop!.height / startBlock.height;
      let proposedCropWidth = proposedWidth * scaleX;
      let proposedCropHeight = proposedHeight * scaleY;

      if (
        proposedCropWidth >
        startBlock.originalMediaSize!.width - pinnedLeftCropX
      ) {
        proposedCropWidth =
          startBlock.originalMediaSize!.width - pinnedLeftCropX;
        proposedWidth = proposedCropWidth / scaleX;
      }

      if (proposedCropHeight > pinnedBottomCropY) {
        proposedCropHeight = pinnedBottomCropY;
        proposedHeight = proposedCropHeight / scaleY;
      }

      newBlock.width = proposedWidth;
      newBlock.height = proposedHeight;
      newBlock.y = pinnedBottomY - proposedHeight;
      newBlockCrop!.width = proposedCropWidth;
      newBlockCrop!.height = proposedCropHeight;
      newBlockCrop!.y = pinnedBottomCropY - proposedCropHeight;
    } else if (corner === "bottom-right") {
      const pinnedLeftX = startBlock.x;
      const pinnedTopY = startBlock.y;
      const pinnedLeftCropX = startBlock.crop!.x;
      const pinnedTopCropY = startBlock.crop!.y;

      let proposedWidth = Math.max(currentPoint.x - pinnedLeftX, minBlockSize);
      let proposedHeight = Math.max(currentPoint.y - pinnedTopY, minBlockSize);

      const scaleX = startBlock.crop!.width / startBlock.width;
      const scaleY = startBlock.crop!.height / startBlock.height;
      let proposedCropWidth = proposedWidth * scaleX;
      let proposedCropHeight = proposedHeight * scaleY;

      if (
        proposedCropWidth >
        startBlock.originalMediaSize!.width - pinnedLeftCropX
      ) {
        proposedCropWidth =
          startBlock.originalMediaSize!.width - pinnedLeftCropX;
        proposedWidth = proposedCropWidth / scaleX;
      }

      if (
        proposedCropHeight >
        startBlock.originalMediaSize!.height - pinnedTopCropY
      ) {
        proposedCropHeight =
          startBlock.originalMediaSize!.height - pinnedTopCropY;
        proposedHeight = proposedCropHeight / scaleY;
      }

      newBlock.width = proposedWidth;
      newBlock.height = proposedHeight;
      newBlockCrop!.width = proposedCropWidth;
      newBlockCrop!.height = proposedCropHeight;
    } else if (corner === "bottom-left") {
      const pinnedRightX = startBlock.x + startBlock.width;
      const pinnedTopY = startBlock.y;
      const pinnedRightCropX = startBlock.crop!.x + startBlock.crop!.width;
      const pinnedTopCropY = startBlock.crop!.y;

      let proposedWidth = Math.max(pinnedRightX - currentPoint.x, minBlockSize);
      let proposedHeight = Math.max(currentPoint.y - pinnedTopY, minBlockSize);

      const scaleX = startBlock.crop!.width / startBlock.width;
      const scaleY = startBlock.crop!.height / startBlock.height;
      let proposedCropWidth = proposedWidth * scaleX;
      let proposedCropHeight = proposedHeight * scaleY;

      if (proposedCropWidth > pinnedRightCropX) {
        proposedCropWidth = pinnedRightCropX;
        proposedWidth = proposedCropWidth / scaleX;
      }

      if (
        proposedCropHeight >
        startBlock.originalMediaSize!.height - pinnedTopCropY
      ) {
        proposedCropHeight =
          startBlock.originalMediaSize!.height - pinnedTopCropY;
        proposedHeight = proposedCropHeight / scaleY;
      }

      newBlock.width = proposedWidth;
      newBlock.height = proposedHeight;
      newBlock.x = pinnedRightX - proposedWidth;
      newBlockCrop!.width = proposedCropWidth;
      newBlockCrop!.height = proposedCropHeight;
      newBlockCrop!.x = pinnedRightCropX - proposedCropWidth;
    }

    if (
      newBlockCrop!.x === 0 &&
      newBlockCrop!.y === 0 &&
      newBlockCrop!.width === newBlock.originalMediaSize!.width &&
      newBlockCrop!.height === newBlock.originalMediaSize!.height
    ) {
      newBlockCrop = null;
    }

    setBlockMap((prev) => {
      return {
        ...prev,
        [stateRef.selectedBlockIds[0]]: {
          ...newBlock,
          crop: newBlockCrop,
        } as BlockType,
      };
    });
  };
}