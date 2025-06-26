import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  SelectedBlockIdsAtom,
  SelectedBoxAtom,
  ShowCropModalAtom,
  showResizerModalAtom,
} from "./atoms";
import { useStream } from "./useStream";
import { ToolCameraSelector } from "./ToolCameraSelector";
import { ToolBlendSelector } from "./ToolBlendSelector";
import { ToolFlipper } from "./ToolFlipper";
import { ToolCrop } from "./ToolCrop";
import { ToolStamp } from "./ToolStamp";
import { ToolDownload } from "./ToolDownload";
import { ToolDirection } from "./ToolDirection";
import { ToolDuplicator } from "./ToolDuplicator";
import { ToolAddCamera } from "./ToolAddCamera";
import { ToolAlign } from "./ToolAlign";
import { ToolAngles } from "./ToolAngles";
import { CropModal } from "./CropModal";

export function Toolbar() {
  const [blockMap] = useAtom(BlockMapAtom);
  const [blockIds] = useAtom(BlockIdsAtom);
  const [selectedBox] = useAtom(SelectedBoxAtom);
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [showCropModal] = useAtom(ShowCropModalAtom);
  const [showResizerModal] = useAtom(showResizerModalAtom);
  useStream();

  const selectedBlocks = useMemo(() => {
    return selectedBlockIds.map((id) => blockMap[id]);
  }, [blockMap, selectedBlockIds]);

  const allBlocks = useMemo(() => {
    return blockIds.map((id) => blockMap[id]);
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
    <>
      <div className="absolute left-0 top-0 pointer-events-none px-3 py-2">
        Sampler
      </div>
      <div className="absolute right-0 top-0 bottom-10 flex flex-col justify-between pointer-events-none w-[240px] p-3">
        <div className="flex flex-col gap-2">
          {!webcamBlockExists && <ToolAddCamera />}
          {webcamIsSelected && (
            <ToolCameraSelector webcamBlocks={selectedWebcamBlocks} />
          )}
          {blocksAreSelected ? <ToolFlipper blocks={selectedBlocks} /> : null}
          {blocksAreSelected ? (
            <ToolBlendSelector blocks={selectedBlocks} />
          ) : null}
          {blocksAreSelected && false ? (
            <ToolAngles blocks={selectedBlocks} />
          ) : null}
          {singleBlockSelected ? <ToolCrop block={selectedBlocks[0]} /> : null}
          {blocksAreSelected && false ? <ToolDirection /> : null}
          {webcamIsSelected ? <ToolStamp /> : null}
          {blocksAreSelected && false ? (
            <ToolDuplicator blocks={selectedBlocks} />
          ) : null}
        </div>
      </div>
      <div className="hidden absolute left-0 bottom-11 flex flex-col gap-2 pointer-events-none">
        {selectedBlockIds.length > 1 ? <ToolAlign /> : null}
      </div>
      <div className="absolute left-0 bottom-0 w-full pointer-events-none">
        <div className="flex py-2">
          <div className="flex w-1/2 items-center px-[1ch] gap-[1ch] flex-wrap">
            <CameraReadout />
          </div>
          <ToolDownload />
          <div className="flex w-1/2 items-center px-[1ch] gap-[1ch] justify-end flex-wrap">
            {selectedBlockIds.length > 0 ? (
              <>
                <div>{`${selectedBlockIds.length}`}</div>
                {selectedBox ? <ResizerReadout /> : null}
              </>
            ) : (
              <div>{`0`}</div>
            )}
          </div>
        </div>
      </div>
      {showCropModal && <CropModal />}
      {showResizerModal && <ResizerModal />}
    </>
  );
}

function ResizerReadout() {
  const [selectedBox] = useAtom(SelectedBoxAtom);
  const [, setShowModal] = useAtom(showResizerModalAtom);

  return (
    <button
      className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 pointer-events-auto"
      onClick={() => setShowModal(true)}
    >
      {Math.round(selectedBox!.width)}x{Math.round(selectedBox!.height)}
    </button>
  );
}

function CameraReadout() {
  const [camera] = useAtom(CameraAtom);

  return <div>{Math.round(camera.z * 100)}%</div>;
}

function ResizerModal() {
  const [_selectedBox] = useAtom(SelectedBoxAtom);
  const selectedBox = _selectedBox!;
  const [newWidth, setNewWidth] = useState(Math.round(selectedBox.width));
  const [, setShowModal] = useAtom(showResizerModalAtom);
  const [newHeight, setNewHeight] = useState(Math.round(selectedBox.height));
  const [blockMap, setBlockMap] = useAtom(BlockMapAtom);
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const selectedBlocks = selectedBlockIds.map((id) => blockMap[id]);

  const rawAspectRatio = selectedBox.width / selectedBox.height;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowModal(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setShowModal]);

  function handleSave() {
    const width = newWidth;
    const height = newHeight;
    const centerX = selectedBox.x + selectedBox.width / 2;
    const centerY = selectedBox.y + selectedBox.height / 2;
    const newX = centerX - width / 2;
    const newY = centerY - height / 2;
    let newBlockMap = { ...blockMap };
    for (const block of selectedBlocks) {
      const xRatio = (block.x - selectedBox.x) / selectedBox.width;
      const yRatio = (block.y - selectedBox.y) / selectedBox.height;
      const newBlockX = newX + xRatio * width;
      const newBlockY = newY + yRatio * height;
      newBlockMap[block.id] = {
        ...block,
        x: newBlockX,
        y: newBlockY,
        width: (block.width / selectedBox.width) * width,
        height: (block.height / selectedBox.height) * height,
      };
    }
    setBlockMap(newBlockMap);
    setShowModal(false);
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex justify-center items-center">
      <div className="flex flex-col gap-2 bg-neutral-900 p-4 w-[400px]">
        <div className="mb-1">Selected size</div>
        <div className="flex gap-2">
          <input
            type="number"
            className="focus:outline-none px-2 py-1 w-1/2"
            value={newWidth}
            onChange={(e) => setNewWidth(parseInt(e.target.value))}
            onBlur={() => {
              setNewHeight(Math.round(newWidth / rawAspectRatio));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setNewHeight(Math.round(newWidth / rawAspectRatio));
              }
            }}
          />
          <div className="py-1">x</div>
          <input
            type="number"
            className="focus:outline-none px-2 py-1 w-1/2"
            value={newHeight}
            onChange={(e) => setNewHeight(parseInt(e.target.value))}
            onBlur={() => {
              setNewWidth(Math.round(newHeight * rawAspectRatio));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setNewWidth(Math.round(newHeight * rawAspectRatio));
              }
            }}
          />
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button
            className="px-3 py-1 underline"
            onClick={() => {
              setShowModal(false);
            }}
          >
            Cancel
          </button>
          <button
            className="px-10 py-1 bg-neutral-800 hover:bg-neutral-700"
            onClick={() => {
              handleSave();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
