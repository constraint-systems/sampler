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

export function useHandleSelectedBoxResizeCropSide() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  // TODO implement redo
  const [, setUndoStack] = useAtom(UndoStackAtom);
  const [, setRedoStack] = useAtom(RedoStackAtom);

  return function handleSelectedBoxSideResize(dragEvent: DragEventType) {
    const side = dragEvent.targetEl
      .getAttribute("data-target")!
      .replace("resize-side-", "");
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
      if (side === "top") {
        dragStateRef.offset = {
          x: dragStateRef.startCanvasPoint.x - dragStateRef.startBlock.x,
          y: dragStateRef.startCanvasPoint.y - dragStateRef.startBlock.y,
        };
      } else if (side === "bottom") {
        dragStateRef.offset = {
          x: dragStateRef.startCanvasPoint.x - dragStateRef.startBlock.x,
          y:
            dragStateRef.startCanvasPoint.y -
            (dragStateRef.startBlock.y + dragStateRef.startBlock.height),
        };
      } else if (side === "left") {
        dragStateRef.offset = {
          x: dragStateRef.startCanvasPoint.x - dragStateRef.startBlock.x,
          y: dragStateRef.startCanvasPoint.y - dragStateRef.startBlock.y,
        };
      } else if (side === "right") {
        dragStateRef.offset = {
          x:
            dragStateRef.startCanvasPoint.x -
            (dragStateRef.startBlock.x + dragStateRef.startBlock.width),
          y: dragStateRef.startCanvasPoint.y - dragStateRef.startBlock.y,
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
    let newBlockCrop =  { ...startBlock.crop } as BoxType | null;

    if (side === "top") {
      let proposedHeight = Math.max(
        startBlock.y + startBlock.height - currentPoint.y,
        minBlockSize,
      );
      const scale = startBlock.crop!.height / startBlock.height;
      const newAspect = startBlock.width / proposedHeight;
      let proposedCropHeight = startBlock.crop!.width / newAspect;
      const pinnedBottomY = startBlock.y + startBlock.height;
      const pinnedBottomCropY = startBlock.crop!.y + startBlock.crop!.height;

      if (proposedCropHeight > pinnedBottomCropY) {
        proposedCropHeight = pinnedBottomCropY;
        proposedHeight = proposedCropHeight / scale;
      }

      newBlock.height = proposedHeight;
      newBlockCrop!.height = proposedCropHeight;
      newBlock.y = pinnedBottomY - proposedHeight;
      newBlockCrop!.y = pinnedBottomCropY - proposedCropHeight;
    } else if (side === "bottom") {
      let proposedHeight = Math.max(
        currentPoint.y - startBlock.y,
        minBlockSize,
      );
      const scale = startBlock.crop!.height / startBlock.height;
      const newAspect = startBlock.width / proposedHeight;
      let proposedCropHeight = startBlock.crop!.width / newAspect;

      if (
        proposedCropHeight >
        startBlock.originalMediaSize!.height - startBlock.crop!.y
      ) {
        proposedCropHeight =
          startBlock.originalMediaSize!.height - startBlock.crop!.y;
        proposedHeight = proposedCropHeight / scale;
      }

      newBlock.height = proposedHeight;
      newBlockCrop!.height = proposedCropHeight;
    } else if (side === "left") {
      let proposedWidth = Math.max(
        startBlock.x + startBlock.width - currentPoint.x,
        minBlockSize,
      );
      const scale = startBlock.crop!.width / startBlock.width;
      const newAspect = proposedWidth / startBlock.height;
      let proposedCropWidth = startBlock.crop!.height * newAspect;
      const pinnedRightX = startBlock.x + startBlock.width;
      const pinnedRightCropX = startBlock.crop!.x + startBlock.crop!.width;

      if (proposedCropWidth > pinnedRightCropX) {
        proposedCropWidth = pinnedRightCropX;
        proposedWidth = proposedCropWidth / scale;
      }

      newBlock.width = proposedWidth;
      newBlockCrop!.width = proposedCropWidth;
      newBlock.x = pinnedRightX - proposedWidth;
      newBlockCrop!.x = pinnedRightCropX - proposedCropWidth;
    } else if (side === "right") {
      let proposedWidth = Math.max(currentPoint.x - startBlock.x, minBlockSize);
      const scale = startBlock.crop!.width / startBlock.width;
      const newAspect = proposedWidth / startBlock.height;
      let proposedCropWidth = startBlock.crop!.height * newAspect;
      if (
        proposedCropWidth >
        startBlock.originalMediaSize!.width - startBlock.crop!.x
      ) {
        proposedCropWidth =
          startBlock.originalMediaSize!.width - startBlock.crop!.x;
        proposedWidth = proposedCropWidth / scale;
      }
      newBlock.width = proposedWidth;
      newBlockCrop!.width = proposedCropWidth;
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

    // if (dragEvent.type === "last") {
    //    setBlockMap((prev) => {
    //       return {
    //         ...prev,
    //         [stateRef.selectedBlockIds[0]]: {
    //           ...prev[stateRef.selectedBlockIds[0]],
    //           crop: null,
    //         },
    //       };
    //     });
    //   }
    // }

    // if (dragEvent.type === "last") {
    //   const redoState = {
    //     blockMap: JSON.parse(JSON.stringify(newBlockMap)),
    //     blockIds: [...stateRef.blockIds],
    //     selectedBlockIds: [...stateRef.selectedBlockIds],
    //   };
    //   setUndoStack((prev) => [
    //     ...prev,
    //     {
    //       undo: {
    //         blockMap: dragStateRef.undoState.blockMap,
    //         blockIds: dragStateRef.undoState.blockIds,
    //         selectedBlockIds: dragStateRef.undoState.selectedBlockIds,
    //       },
    //       redo: {
    //         blockMap: redoState.blockMap,
    //         blockIds: redoState.blockIds,
    //         selectedBlockIds: redoState.selectedBlockIds,
    //       },
    //     },
    //   ]);
    //   setRedoStack([]);
    // }
  };
}
