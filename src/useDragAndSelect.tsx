import { useDrag } from "@use-gesture/react";
import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  BlockSelectorCreatorAtom,
  isDraggingAtom,
  SelectedBlockIdsAtom,
  StateRefAtom,
} from "./atoms";
import { useRef } from "react";
import { screenToCanvas } from "./Camera";
import {
  blockIntersectsRotatedBlocks,
  blockOverlapsBlocks,
  makeZIndex,
  pointIntersectsBlocks,
  pointIntersectsBox,
} from "./utils";
import { BlockType, PointType } from "./types";
import { v4 as uuid } from "uuid";

export function useDragAndSelect() {
  const [, setBlockSelector] = useAtom(BlockSelectorCreatorAtom);
  const [stateRef] = useAtom(StateRefAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setIsDragging] = useAtom(isDraggingAtom);

  const initialPositionsRef = useRef<PointType[]>([]);
  const initialPointRef = useRef({ x: 0, y: 0 });

  return useDrag(async ({ first, last, xy: [x, y], altKey }) => {
    const canvasPoint = screenToCanvas(
      { x, y },
      stateRef.camera,
      stateRef.zoomContainer!,
    );
    const currentBlocks = stateRef.blockIds.map((id) => stateRef.blockMap[id]);
    if (first) {
      initialPointRef.current = { x: canvasPoint.x, y: canvasPoint.y };
      if (stateRef.blockSelector) {
        const intersectsBlockSelector = pointIntersectsBox(
          canvasPoint,
          stateRef.blockSelector,
        );
        if (intersectsBlockSelector) {
          initialPositionsRef.current = stateRef.selectedBlockIds.map((id) => {
            const block = stateRef.blockMap[id];
            return {
              x: block.x,
              y: block.y,
            };
          });
          setIsDragging(true);
        }
      } else {
        const intersected = pointIntersectsBlocks({ x: canvasPoint.x, y: canvasPoint.y }, currentBlocks);

        if (intersected.length > 0) {
          const sortedBlocks = intersected.sort((a, b) => b.zIndex - a.zIndex);

          const topBlock = sortedBlocks[0].id;

          if (stateRef.selectedBlockIds.includes(topBlock)) {
            // keep selection
          } else {
            stateRef.selectedBlockIds = [topBlock];
            setSelectedBlockIds([topBlock]);
          }
          initialPositionsRef.current = stateRef.selectedBlockIds.map((id) => {
            const block = stateRef.blockMap[id];
            return {
              x: block.x,
              y: block.y,
            };
          });
          setIsDragging(true);
        } else {
          stateRef.selectedBlockIds = [];
          setSelectedBlockIds([]);
        }
      }

      if (altKey) {
        // duplicate selected blocks
        const selectedBlocks = stateRef.selectedBlockIds.map(
          (id) => stateRef.blockMap[id],
        );
        let newBlockObj: Record<string, BlockType> = {};
        for (let i = 0; i < selectedBlocks.length; i++) {
          const block = selectedBlocks[i];
          const newId = uuid();
          newBlockObj[newId] = {
            ...block,
            id: newId,
            x: block.x,
            y: block.y,
            zIndex: makeZIndex() + 1,
          } as BlockType;
        }
        stateRef.blockMap = { ...stateRef.blockMap, ...newBlockObj };
        setBlockMap((prev) => {
          return { ...prev, ...newBlockObj };
        });
        stateRef.blockIds = [...stateRef.blockIds, ...Object.keys(newBlockObj)];
        setBlockIds((prev) => {
          return [...prev, ...Object.keys(newBlockObj)];
        });
        stateRef.selectedBlockIds = Object.keys(newBlockObj);
      }
    }

    if (stateRef.selectedBlockIds.length === 0) {
      const minX = Math.min(canvasPoint.x, initialPointRef.current.x);
      const minY = Math.min(canvasPoint.y, initialPointRef.current.y);
      const maxX = Math.max(canvasPoint.x, initialPointRef.current.x);
      const maxY = Math.max(canvasPoint.y, initialPointRef.current.y);
      const blockSelector = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
      stateRef.blockSelector = blockSelector;
      setBlockSelector(blockSelector);
    } else {
      // moveBlocks
      const selectedBlocks = stateRef.selectedBlockIds.map(
        (id) => stateRef.blockMap[id],
      );
      let newBlockObj: Record<string, BlockType> = {};
      for (let i = 0; i < selectedBlocks.length; i++) {
        const block = selectedBlocks[i];
        newBlockObj[block.id] = {
          ...block,
          x:
            initialPositionsRef.current[i].x +
            (canvasPoint.x - initialPointRef.current.x),
          y:
            initialPositionsRef.current[i].y +
            (canvasPoint.y - initialPointRef.current.y),
          zIndex: makeZIndex() + 1,
        } as BlockType;
      }
      setBlockMap((prev) => {
        return { ...prev, ...newBlockObj };
      });
    }

    if (last) {
      if (stateRef.blockSelector) {
        const _selectedBlocks = blockOverlapsBlocks(
          stateRef.blockSelector as BlockType,
          currentBlocks,
        );
        const sortedBlocks = _selectedBlocks.sort(
          (a, b) => b.zIndex - a.zIndex,
        );
        const sortedBlocksIds = sortedBlocks.map((block) => block.id);

        stateRef.selectedBlockIds = sortedBlocksIds;
        setSelectedBlockIds(sortedBlocksIds);
        stateRef.blockSelector = null;
        setBlockSelector(null);
        setIsDragging(false);
      }
    }
  });
}
