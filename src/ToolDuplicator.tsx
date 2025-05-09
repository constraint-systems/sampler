import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  stampMoveDirectionAtom,
  stampMoveOffsetAtom,
  StateRefAtom,
} from "./atoms";
import {
  BlockType,
  ImageBlockType,
} from "./types";
import { offsetLookup } from "./consts";
import { v4 as uuid } from "uuid";
import { makeZIndex } from "./utils";
import { screenToCanvas } from "./Camera";

export function ToolDuplicator({ blocks }: { blocks: BlockType[] }) {
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setCamera] = useAtom(CameraAtom);
  const [stateRef] = useAtom(StateRefAtom);

  const [stampMoveDirection] = useAtom(
    stampMoveDirectionAtom,
  );
  const [stampMoveOffset] = useAtom(stampMoveOffsetAtom);

  return (
    <div className="flex flex-col items-end">
     <button
        className="px-3 py-1 pointer-events-auto bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center"
        onClick={(e) => {
          e.stopPropagation();
          let centerDistance = Infinity;
          let centerMoveX = 0;
          let centerMoveY = 0;
          const currentCenter = screenToCanvas(
            {
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            },
            stateRef.camera,
            stateRef.zoomContainer!,
          );

          for (const block of blocks) {
            let horizontalMove = 0;
            let verticalMove = 0;
            if (
              stampMoveDirection === "←" ||
              stampMoveDirection === "↖" ||
              stampMoveDirection === "↙"
            ) {
              horizontalMove = -1 * offsetLookup[stampMoveOffset];
            }
            if (
              stampMoveDirection === "→" ||
              stampMoveDirection === "↗" ||
              stampMoveDirection === "↘"
            ) {
              horizontalMove = 1 * offsetLookup[stampMoveOffset];
            }
            if (
              stampMoveDirection === "↑" ||
              stampMoveDirection === "↖" ||
              stampMoveDirection === "↗"
            ) {
              verticalMove = -1 * offsetLookup[stampMoveOffset];
            }
            if (
              stampMoveDirection === "↓" ||
              stampMoveDirection === "↙" ||
              stampMoveDirection === "↘"
            ) {
              verticalMove = 1 * offsetLookup[stampMoveOffset];
            }
            if (stampMoveDirection === "•") {
              horizontalMove = 0;
              verticalMove = 0;
            }

            const blockCenterX = block.x + block.width / 2;
            const blockCenterY = block.y + block.height / 2;
            const thisCenterDistance = Math.sqrt(
              (blockCenterX - currentCenter.x) ** 2 +
                (blockCenterY - currentCenter.y) ** 2,
            );
            if (thisCenterDistance < centerDistance) {
              centerDistance = thisCenterDistance;
              centerMoveX = horizontalMove * block.width;
              centerMoveY = verticalMove * block.height;
            }

           const newId = uuid();
            const newBlock = {
              ...block,
              id: newId,
            } as BlockType;

            setBlockIds((prev) => [...prev, newId]);
            setBlockMap((prev) => ({
              ...prev,
              [newId]: newBlock,
              [block.id]: {
                ...block,
                x: block.x + horizontalMove * block.width,
                y: block.y + verticalMove * block.height,
                zIndex: makeZIndex() + 1,
              },
            }));
          }
          const duration = 300;
          const start = performance.now();
          const initialCameraX = stateRef.camera.x;
          const initialCameraY = stateRef.camera.y;
          const animate = (time: number) => {
            const progress = Math.min((time - start) / duration, 1);
            const additionX = centerMoveX * progress;
            const additionY = centerMoveY * progress;
            setCamera((prev) => {
              return {
                ...prev,
                x: initialCameraX - additionX,
                y: initialCameraY - additionY,
              };
            });
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }}
      >
        duplicate
      </button>
    </div>
  );
}
