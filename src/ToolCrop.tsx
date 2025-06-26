import { useAtom } from "jotai";
import { ShowCropModalAtom } from "./atoms";
import { BlockType } from "./types";

export function ToolCrop({ block }: { block: BlockType }) {
  const [, setShowCropModal] = useAtom(ShowCropModalAtom);

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
