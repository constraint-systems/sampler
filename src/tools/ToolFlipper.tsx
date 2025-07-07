import { useAtom } from "jotai";
import { BlockMapAtom } from "../atoms";
import { BlockType } from "../types";
import { TwoUp } from "./TwoUp";
import { ToolSlot } from "./ToolSlot";
import { ToolButton } from "./ToolButton";

export function ToolFlipper({ blocks }: { blocks: BlockType[] }) {
  const [, setBlockMap] = useAtom(BlockMapAtom);

  return (
      <TwoUp>
        <ToolButton
          onClick={() => {
            setBlockMap((prev) => {
              const newBlocks = { ...prev };
              blocks.forEach((block) => {
                const newBlock = { ...block };
                newBlock.flippedHorizontally = !newBlock.flippedHorizontally;
                newBlocks[block.id] = newBlock;
              });
              return newBlocks;
            });
          }}
        >
          Flip →
        </ToolButton>
        <ToolButton
          onClick={() => {
            setBlockMap((prev) => {
              const newBlocks = { ...prev };
              blocks.forEach((block) => {
                const newBlock = { ...block };
                newBlock.flippedVertically = !newBlock.flippedVertically;
                newBlocks[block.id] = newBlock;
              });
              return newBlocks;
            });
          }}
        >
          Flip ↓
        </ToolButton>
      </TwoUp>
  );
}
