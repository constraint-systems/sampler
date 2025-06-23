import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  SelectedBlockIdsAtom,
  SelectedBoxAtom,
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

export function Toolbar() {
  const [blockMap] = useAtom(BlockMapAtom);
  const [blockIds] = useAtom(BlockIdsAtom);
  const [selectedBox] = useAtom(SelectedBoxAtom);
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
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
                {selectedBox ? (
                  <div>
                    {Math.round(selectedBox.width)}x
                    {Math.round(selectedBox.height)}
                  </div>
                ) : null}
              </>
            ) : (
              <div>{`0`}</div>
            )}
          </div>
        </div>
      </div>
      <ResizerModal />
    </>
  );
}

function CameraReadout() {
  const [camera] = useAtom(CameraAtom);

  return <div>{Math.round(camera.z * 100)}%</div>;
}

function ResizerModal() {
  const [_selectedBox] = useAtom(SelectedBoxAtom);
  const selectedBox = _selectedBox!;
  const [newWidth, setNewWidth] = useState(selectedBox.width);
  const [newHeight, setNewHeight] = useState(selectedBox.height);

  const rawAspectRatio = selectedBox.width / selectedBox.height;
  const aspectRatio = Math.round(rawAspectRatio * 100) / 100;
  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex justify-center items-center">
      <div className="flex flex-col gap-2">
        <div>Selected size</div>
        <div className="flex flex-col items-start gap-2">
          <div className="flex gap-2">
            <div>{selectedBox.width}</div>
            <div>
              <input
                type="text"
                className="text-right"
                value={newWidth}
                onChange={(e) => setNewWidth(parseInt(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setNewHeight(Math.round(newWidth / rawAspectRatio));
                  }
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div>{selectedBox.height}</div>
            <div>
              <input
                type="text"
                className="text-right"
                value={newHeight}
                onChange={(e) => setNewHeight(parseInt(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setNewWidth(Math.round(newHeight * rawAspectRatio));
                  }
                }}
              />
            </div>
          </div>
          <div>{aspectRatio}</div>
        </div>
        <div>
          <button className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700">
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
