import { useAtom } from "jotai";
import { useDevices } from "./useDevices";
import { BlockMapAtom } from "./atoms";
import { BlendTypes, BlockType, WebcamBlockType } from "./types";
import { blendOptions, offsetLookup } from "./consts";
import { FlipHorizontal2, FlipVertical2 } from "lucide-react";

export function ToolFlipper({ blocks }: { blocks: BlockType[] }) {
  const [, setBlockMap] = useAtom(BlockMapAtom);

  const flippedHorizontally = new Set(blocks.map((block) => block.flippedHorizontally));
  const flippedVertically = new Set(blocks.map((block) => block.flippedVertically));

  let horizontalState = "multiple";
  let verticalState = "multiple";
  if (flippedHorizontally.size === 1) {
    horizontalState = flippedHorizontally.values().next().value!.toString();
  }
  if (flippedVertically.size === 1) {
    verticalState = flippedVertically.values().next().value!.toString();
  }

  return (
    <div className="flex gap-2">
      <button
        className={`px-3 w-1/2 pointer-events-auto text-center py-1 ${horizontalState === "true" ? "bg-neutral-700" : "bg-neutral-800"} hover:bg-neutral-700`}
        onClick={() => {
          setBlockMap((prev) => {
            const newMap = { ...prev };
            blocks.forEach((block) => {
              newMap[block.id] = {
                ...newMap[block.id],
                flippedHorizontally: !block.flippedHorizontally,
              };
            });
            return newMap;
          });
        }}
      >
        ←→
      </button>
      <button
        className={`px-3 py-1 w-1/2 text-center pointer-events-auto ${verticalState === "true" ? "bg-neutral-700" : "bg-neutral-800"} hover:bg-neutral-700`}
        onClick={() => {
          setBlockMap((prev) => {
            const newMap = { ...prev };
            blocks.forEach((block) => {
              newMap[block.id] = {
                ...newMap[block.id],
                flippedVertically: !block.flippedVertically,
              };
            });
            return newMap;
          });
        }}
      >
        ↑↓
      </button>
    </div>
  );
}
