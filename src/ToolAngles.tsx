import { useAtom } from "jotai";
import { BlockMapAtom } from "./atoms";
import { BlockType } from "./types";

export function ToolAngles({ blocks }: { blocks: BlockType[] }) {
  const [, setBlockMap] = useAtom(BlockMapAtom);


  const angles = [
    ["↖", -Math.PI / 4],
    ["↑", 0],
    ["↗", Math.PI / 4],
    ["→", Math.PI / 2],
    ["↙", (-3 * Math.PI) / 4],
    ["↓", Math.PI],
    ["↘", (3 * Math.PI) / 4],
    ["←", -Math.PI / 2],
  ];

  return (
    <div className="grid grid-cols-4">
      {angles.map((angle) => (
        <button
          key={angle[1]}
          className={`px-3 pointer-events-auto py-1 text-left bg-neutral-800 hover:bg-neutral-700`}
          onClick={() => {
            setBlockMap((prev) => {
              const newMap = { ...prev };
              blocks.forEach((block) => {
                newMap[block.id] = {
                  ...newMap[block.id],
                  rotation: angle[1] as number,
                };
              });
              return newMap;
            });
          }}
        >
          {angle[0]}
        </button>
      ))}
    </div>
  );
}
