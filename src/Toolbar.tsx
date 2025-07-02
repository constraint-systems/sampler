import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  RedoStackAtom,
  SelectedBlockIdsAtom,
  StampDirectionAtom,
  UndoStackAtom,
} from "./atoms";
import { useApplyHistoryState } from "./history/useApplyHistoryState";
import { arrows } from "./consts";
import { useMemo, useState } from "react";
import { ToolDownload } from "./tools/ToolDownload";
import { ToolCameraSelector } from "./tools/ToolCameraSelector";

export function Toolbar() {
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [stampDirection, setStampDirection] = useAtom(StampDirectionAtom);
  const [undoStack, setUndoStack] = useAtom(UndoStackAtom);
  const [redoStack, setRedoStack] = useAtom(RedoStackAtom);
  const applyHistoryState = useApplyHistoryState();
  const [blockMap] = useAtom(BlockMapAtom);
  const [blockIds] = useAtom(BlockIdsAtom);
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);

  const allBlocks = useMemo(() => {
    return blockIds.map((id) => blockMap[id]);
  }, [blockMap, selectedBlockIds]);

  const selectedBlocks = useMemo(() => {
    return selectedBlockIds.map((id) => blockMap[id]);
  }, [blockMap, selectedBlockIds]);

  const selectedWebcamBlocks = selectedBlocks.filter(
    (block) => block.type === "webcam",
  );

  const selectedImageBlocks = selectedBlocks.filter(
    (block) => block.type === "image",
  );

  const allWebcamBlocks = allBlocks.filter((block) => block.type === "webcam");

  const webcamBlockExists = allWebcamBlocks.length > 0;

  const blocksAreSelected = selectedBlockIds.length > 0;
  const singleBlockSelected = selectedBlockIds.length === 1;
  const multipleBlocksSelected = selectedBlockIds.length > 1;
  const webcamIsSelected = selectedWebcamBlocks.length > 0;

  return (
    <div className="fixed right-3 top-3 flex flex-col items-end gap-3 z-50">
      <div className="flex gap-2">
        <button
          className="px-3 py-2 bg-red-800 hidden hover:bg-red-700"
          onClick={() => {
            // const newBlockId = crypto.randomUUID();
            // setBlockIds((prev) => [...prev, newBlockId]);
            // setBlockMap((prev) => ({
            //   ...prev,
            //   [newBlockId]: {
            //     id: newBlockId,
            //     x: 0,
            //     y: 0,
            //     width: 320,
            //     height: 240,
            //     zIndex: makeZIndex(),
            //   },
            // }));
            // setSelectedBlockIds((prev) => [newBlockId]);
          }}
        >
          +Camera
        </button>
        <button
          className="px-3 py-2 bg-yellow-800 hidden hover:bg-yellow-700"
          onClick={() => {
            // const newBlockId = crypto.randomUUID();
            // setBlockIds((prev) => [...prev, newBlockId]);
            // setBlockMap((prev) => ({
            //   ...prev,
            //   [newBlockId]: {
            //     id: newBlockId,
            //     x: 0,
            //     y: 0,
            //     width: 320,
            //     height: 240,
            //     zIndex: makeZIndex(),
            //   },
            // }));
            // setSelectedBlockIds((prev) => [newBlockId]);
          }}
        >
          +Image
        </button>
      </div>

      <div className="fixed right-3 top-3 flex flex-col items-end gap-3 z-50">
        {webcamIsSelected && (
          <ToolCameraSelector webcamBlocks={selectedWebcamBlocks} />
        )}
 
      </div>
      <div className="fixed right-3 bottom-3 flex flex-col items-end gap-3 z-50">
        <div className="flex gap-2 hidden">
          <StampDirection />
        </div>
        <div></div>
       <ToolDownload />
      </div>
    </div>
  );
}

function StampDirection() {
  const [showModal, setShowModal] = useState(false);
  const [stampDirection, setStampDirection] = useAtom(StampDirectionAtom);

  return (
    <div className="flex gap-2 relative">
      <button className="px-3 py-2 bg-neutral-800">Stamp</button>
      <div className="relative">
        <button
          className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700"
          onClick={() => setShowModal((prev) => !prev)}
        >
          {stampDirection}
        </button>
        {showModal && (
          <div className="absolute right-0 bottom-0">
            {arrows.map((arrow) => (
              <button
                key={arrow}
                className="block px-4 py-2 hover:bg-gray-200"
                onClick={() => {
                  setStampDirection(arrow);
                  setShowModal(false);
                }}
              >
                {arrow}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
