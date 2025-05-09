import { useAtom } from "jotai";
import { useDevices } from "./useDevices";
import { BlockMapAtom } from "./atoms";
import { BlendTypes, BlockType, WebcamBlockType } from "./types";
import { blendOptions, offsetLookup } from "./consts";

export function ToolBlendSelector({ blocks }: { blocks: BlockType[] }) {
  const blendSelected = new Set(blocks.map((block) => block.blend));
  const [, setBlockMap] = useAtom(BlockMapAtom);
  let selection = "multiple";
  if (blendSelected.size === 1) {
    selection = blendSelected.values().next().value!;
  }

  return (
    <div className="flex flex-col">
      {blendOptions.map((item) => (
        <div
          key={item}
          className="flex justify-end">
          <button
            className={`px-3 py-1 pointer-events-auto text-right ${item === selection ? "bg-neutral-700" : "bg-neutral-800"} hover:bg-neutral-700`}
            onClick={(e) => {
              e.stopPropagation();
              setBlockMap((prev) => {
                const newMap = { ...prev };
                blocks.forEach((block) => {
                  newMap[block.id] = {
                    ...newMap[block.id],
                    blend: item as BlendTypes,
                  };
                });
                return newMap;
              });
            }}
          >
            {item}
          </button>
        </div>
      ))}
    </div>
  );
}
