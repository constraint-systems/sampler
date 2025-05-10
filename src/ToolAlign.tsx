import { useAtom } from "jotai";
import { BlockMapAtom, StateRefAtom } from "./atoms";
import { getRotatedExtents } from "./utils";

export function ToolAlign() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);

  // const arrows = ["↖", "↑", "↗", "←", "•", "→", "↙", "↓", "↘"];

  function getSelectedBlocks() {
    const { selectedBlockIds, blockMap } = stateRef;
    return selectedBlockIds.map((id) => blockMap[id]);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="hidden">
        <button
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            const blocks = getSelectedBlocks();
            let minX = Infinity;
            const extents = blocks.map((block) => getRotatedExtents(block));
            for (let i = 0; i < blocks.length; i++) {
              minX = Math.min(minX, extents[i].minX);
            }
            setBlockMap((prev) => {
              const newMap = { ...prev };
              blocks.forEach((block, i) => {
                const dx = extents[i].minX - minX;
                newMap[block.id] = {
                  ...newMap[block.id],
                  x: block.x - dx,
                };
              });
              return newMap;
            });
          }}
        >
          left
        </button>
        <button
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            const blocks = getSelectedBlocks();
            let maxX = -Infinity;
            const extents = blocks.map((block) => getRotatedExtents(block));
            for (let i = 0; i < blocks.length; i++) {
              maxX = Math.max(maxX, extents[i].maxX);
            }
            setBlockMap((prev) => {
              const newMap = { ...prev };
              blocks.forEach((block, i) => {
                const dx = extents[i].maxX - maxX;
                newMap[block.id] = {
                  ...newMap[block.id],
                  x: block.x - dx,
                };
              });
              return newMap;
            });
          }}
        >
          right
        </button>
      </div>
      <div className="hidden">
        <button
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            const blocks = getSelectedBlocks();
            let minY = Infinity;
            const extents = blocks.map((block) => getRotatedExtents(block));
            for (let i = 0; i < blocks.length; i++) {
              minY = Math.min(minY, extents[i].minY);
            }
            setBlockMap((prev) => {
              const newMap = { ...prev };
              blocks.forEach((block, i) => {
                const dy = extents[i].minY - minY;
                newMap[block.id] = {
                  ...newMap[block.id],
                  y: block.y - dy,
                };
              });
              return newMap;
            });
          }}
        >
          top
        </button>
        <button
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            const blocks = getSelectedBlocks();
            let maxY = -Infinity;
            const extents = blocks.map((block) => getRotatedExtents(block));
            for (let i = 0; i < blocks.length; i++) {
              maxY = Math.max(maxY, extents[i].maxY);
            }
            setBlockMap((prev) => {
              const newMap = { ...prev };
              blocks.forEach((block, i) => {
                const dy = extents[i].maxY - maxY;
                newMap[block.id] = {
                  ...newMap[block.id],
                  y: block.y - dy,
                };
              });
              return newMap;
            });
          }}
        >
          bottom
        </button>
      </div>
      <div className="flex pointer-events-auto">
        <button
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            const blocks = getSelectedBlocks();

            const extents = blocks.map((block) => getRotatedExtents(block));

            // sort blocks by their minX
            extents.sort((a, b) => a.minX - b.minX);

            const sortedBlocks = extents.map(
              (ext) => stateRef.blockMap[ext.blockId],
            );

            const minX = Math.min(...extents.map((ext) => ext.minX));

            let cursor = minX;
            setBlockMap((prev) => {
              const newMap = { ...prev };
              sortedBlocks.forEach((block, i) => {
                const extent = extents[i];
                newMap[block.id] = {
                  ...newMap[block.id],
                  x: cursor,
                };
                cursor += extent.width;
              });
              return newMap;
            });
          }}
        >
          stack H
        </button>
        <button
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            const blocks = getSelectedBlocks();

            const extents = blocks.map((block) => getRotatedExtents(block));

            // sort blocks by their minY
            extents.sort((a, b) => a.minY - b.minY);

            const sortedBlocks = extents.map(
              (ext) => stateRef.blockMap[ext.blockId],
            );

            const minY = Math.min(...extents.map((ext) => ext.minY));

            let cursor = minY;
            setBlockMap((prev) => {
              const newMap = { ...prev };
              sortedBlocks.forEach((block, i) => {
                const extent = extents[i];
                newMap[block.id] = {
                  ...newMap[block.id],
                  y: cursor,
                };
                cursor += extent.height;
              });
              return newMap;
            });
          }}
        >
          stack V
        </button>
      </div>
      <div className="flex pointer-events-auto">
        <button
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            const blocks = getSelectedBlocks();

            // already got container
            const selectedBox = stateRef.selectedBox;

            const newCenter = selectedBox!.x + selectedBox!.width / 2;

            setBlockMap((prev) => {
              const newMap = { ...prev };
              blocks.forEach((block) => {
                newMap[block.id] = {
                  ...newMap[block.id],
                  x: newCenter - block.width / 2,
                };
              });
              return newMap;
            });
          }}
        >
          center H
        </button>
        <button
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            const blocks = getSelectedBlocks();

            // already got container
            const selectedBox = stateRef.selectedBox;
            const newCenter = selectedBox!.y + selectedBox!.height / 2;

            setBlockMap((prev) => {
              const newMap = { ...prev };
              blocks.forEach((block) => {
                newMap[block.id] = {
                  ...newMap[block.id],
                  y: newCenter - block.height / 2,
                };
              });
              return newMap;
            });
          }}
        >
          center V
        </button>
      </div>
      <div className="flex pointer-events-auto">
        <button
          className="px-3 py-1 bg-neutral-800  hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            const blocks = getSelectedBlocks();

            const extents = blocks.map((block) => getRotatedExtents(block));

            // sort blocks by their minX
            extents.sort((a, b) => a.minX - b.minX);

            const sortedBlocks = extents.map(
              (ext) => stateRef.blockMap[ext.blockId],
            );

            const minX = Math.min(...extents.map((ext) => ext.minX));
            const maxX = Math.max(...extents.map((ext) => ext.maxX));
            const containerWidth = maxX - minX;

            const totalWidth = extents.reduce((acc, ext) => acc + ext.width, 0);

            const spacing = (containerWidth - totalWidth) / (blocks.length - 1);

            let cursor = minX;
            setBlockMap((prev) => {
              const newMap = { ...prev };
              sortedBlocks.forEach((block, i) => {
                const extent = extents[i];
                newMap[block.id] = {
                  ...newMap[block.id],
                  x: cursor + (extent.width - block.width) / 2,
                };
                cursor += extent.width + spacing;
              });
              return newMap;
            });
          }}
        >
          distribute H
        </button>
        <button
          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            const blocks = getSelectedBlocks();

            const extents = blocks.map((block) => getRotatedExtents(block));

            // sort blocks by their minY
            extents.sort((a, b) => a.minY - b.minY);

            const sortedBlocks = extents.map(
              (ext) => stateRef.blockMap[ext.blockId],
            );

            const minY = Math.min(...extents.map((ext) => ext.minY));
            const maxY = Math.max(...extents.map((ext) => ext.maxY));
            const containerHeight = maxY - minY;

            const totalHeight = extents.reduce(
              (acc, ext) => acc + ext.height,
              0,
            );

            const spacing =
              (containerHeight - totalHeight) / (blocks.length - 1);

            let cursor = minY;
            setBlockMap((prev) => {
              const newMap = { ...prev };
              sortedBlocks.forEach((block, i) => {
                const extent = extents[i];
                newMap[block.id] = {
                  ...newMap[block.id],
                  y: cursor + (extent.height - block.height) / 2,
                };
                cursor += extent.height + spacing;
              });
              return newMap;
            });
          }}
        >
          distribute V
        </button>
      </div>
    </div>
  );
}
