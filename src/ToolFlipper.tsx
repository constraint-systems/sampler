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
    <div className="flex">
      <button
        className={`px-3 pointer-events-auto py-1 text-left ${horizontalState === "true" ? "bg-neutral-700" : "bg-neutral-800"} hover:bg-neutral-700`}
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
        className={`px-3 py-1 pointer-events-auto text-left ${verticalState === "true" ? "bg-neutral-700" : "bg-neutral-800"} hover:bg-neutral-700`}
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
