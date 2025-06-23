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
    <div className="flex">
      <select
        className="pointer-events-auto px-3 py-1 focus:outline-none bg-neutral-800 w-full"
        onClick={(e) => {
          e.stopPropagation();
        }}
        onChange={(e) => {
          setBlockMap((prev) => {
            const newMap = { ...prev };
            blocks.forEach((block) => {
              newMap[block.id] = {
                ...newMap[block.id],
                blend: e.target.value as BlendTypes,
              };
            });
            return newMap;
          });
        }}
      >
        {blendOptions.map((item) => (
          <option
            key={item}
            value={item}
            className={`px-3 py-1 pointer-events-auto ${item === selection ? "bg-neutral-700" : "bg-neutral-800"} hover:bg-neutral-700`}
          >
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
