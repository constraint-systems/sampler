import { useAtom } from "jotai";
import { BlockMapAtom, showCropModalAtom } from "./atoms";
import { BlockType } from "./types";
import { FlipHorizontal2, FlipVertical2 } from "lucide-react";

export function ToolCrop({ block }: { block: BlockType }) {
  const [showCropModal, setShowCropModal] = useAtom(showCropModalAtom);

  return (
    <div className="flex flex-col">
      <button
        className={`px-3 py-1 pointer-events-auto bg-neutral-800 hover:bg-neutral-700`}
        onClick={() => {
          setShowCropModal(block.id);
        }}
      >
        crop
      </button>
    </div>
  );
}
