import { useAtom } from "jotai";
import { BlockIdsAtom, BlockMapAtom } from "./atoms";
import { v4 as uuid } from "uuid";

export function BlockStamper({ id }: { id: string }) {
  const [blockMap] = useAtom(BlockMapAtom);
  const [blockIds] = useAtom(BlockIdsAtom);
  const size = 24;

  return (
    <div
      className="absolute left-1/2 -bottom-10 border-2 rounded-2xl border-blue-500 pointer-events-auto bg-black cursor-pointer"
      style={{
        marginLeft: -size,
        width: size * 2,
        height: size,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        const currentBlock = blockMap[id];
        const newId = uuid();
        const newBlock = {
          ...currentBlock,
          id: newId,
          x: currentBlock.x,
          y: currentBlock.y,
          zIndex: blockIds.length,
        };
      }}
    />
  );
}
