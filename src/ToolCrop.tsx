import { useAtom } from "jotai";
import { BlockMapAtom, showCropModalAtom } from "./atoms";
import { BlockType } from "./types";
import { FlipHorizontal2, FlipVertical2 } from "lucide-react";

export function ToolCrop({ block }: { block: BlockType }) {
  const [showCropModal, setShowCropModal] = useAtom(showCropModalAtom);

  return (
    <div className="flex">
      <button
        className={`px-3 py-1 pointer-events-auto hover:bg-neutral-700 w-full ${block.crop ? "bg-neutral-700" : "bg-neutral-800"}`}
        onClick={() => {
          setShowCropModal(block.id);
        }}
      >
        {block.crop ? "edit crop" : "crop"}
      </button>
    </div>
  );
}
