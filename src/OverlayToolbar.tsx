import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  devicesAtom,
  SelectedBlockIdsAtom,
  showCropModalAtom,
  StateRefAtom,
  ShowBlockMenuAtom,
} from "./atoms";
import { arrows, blendOptions, minBlockSize } from "./consts";
import { useMemo, useState } from "react";
import { ToolDownload } from "./tools/ToolDownload";
import { ToolCameraSelector } from "./tools/ToolCameraSelector";
import { ToolFlipper } from "./tools/ToolFlipper";
import { getBoxBoundsFromBlocks, makeZIndex } from "./utils";
import { TwoUp } from "./tools/TwoUp";
import { ToolSlot } from "./tools/ToolSlot";
import { ToolValue } from "./tools/ToolValue";
import { ToolButton } from "./tools/ToolButton";
import { ToolSelect, ToolSelectOption } from "./tools/ToolSelect";
import { SelectedBox } from "./SelectedBox";
import {
  useCreateBlock,
  useDeleteSelectedBlocks,
  useDuplicateSelectedBlocks,
  useHandleStampBlocks,
  useUpdateBlocks,
} from "./hooks";
import { canvasToScreen } from "./Camera";
import { BlockType } from "./types";
import { ToolCheckbox } from "./tools/ToolCheckbox";

export function OverlayToolbar() {
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [, setShowCropModal] = useAtom(showCropModalAtom);
  const [showBlockMenu, setShowBlockMenu] = useAtom(ShowBlockMenuAtom);
  const [blockMap] = useAtom(BlockMapAtom);
  const [blockIds] = useAtom(BlockIdsAtom);
  const [camera] = useAtom(CameraAtom);
  const [devices] = useAtom(devicesAtom);
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const createBlock = useCreateBlock();
  const [stateRef] = useAtom(StateRefAtom);
  const deleteSelectedBlocks = useDeleteSelectedBlocks();
  const duplicateSelectedBlocks = useDuplicateSelectedBlocks();
  const handleStamp = useHandleStampBlocks();
  const updateBlocks = useUpdateBlocks();

  const allBlocks = useMemo(() => {
    return blockIds.map((id) => blockMap[id]);
  }, [blockMap, selectedBlockIds]);

  const selectedBlocks = useMemo(() => {
    return selectedBlockIds.map((id) => blockMap[id]);
  }, [blockMap, selectedBlockIds]);

  const selectedBox = useMemo(() => {
    return getBoxBoundsFromBlocks(selectedBlocks);
  }, [selectedBlocks]);

  const selectedWebcamBlocks = selectedBlocks.filter(
    (block) => block.type === "webcam",
  );

  const selectedImageBlocks = selectedBlocks.filter(
    (block) => block.type === "image",
  );

  const allBlockBounds = useMemo(() => {
    return getBoxBoundsFromBlocks(allBlocks);
  }, [allBlocks]);

  const allWebcamBlocks = allBlocks.filter((block) => block.type === "webcam");
  const allImageBlocks = allBlocks.filter((block) => block.type === "image");

  const webcamBlockExists = allWebcamBlocks.length > 0;

  const blocksAreSelected = selectedBlockIds.length > 0;
  const singleBlockSelected = selectedBlockIds.length === 1;
  const multipleBlocksSelected = selectedBlockIds.length > 1;
  const webcamIsSelected = selectedWebcamBlocks.length > 0;

  const numberWebcamBlocksSelected = selectedWebcamBlocks.length;
  const numberImageBlocksSelected = selectedImageBlocks.length;
  const singleBlock = singleBlockSelected ? selectedBlocks[0] : null;

  return (
    <>
      <div
        className="absolute hidden pointer-events-none left-0 top-0 w-[24ch] gap-[0.5ch]  flex-col z-50 px-[0.5ch]"
        style={{
          transformOrigin: "0 0",
          transform: `translate(${allBlockBounds.x + allBlockBounds.width}px, ${allBlockBounds.y + allBlockBounds.height / 2}px) scale(${Math.max(
            Math.min(1 / camera.z, 8),
            0.5,
          )})`,
        }}
      >
        <div className="absolute hidden left-0 w-full translate-x-[24px] -translate-y-1/2 px-[1.5ch] py-[1ch] flex-col flex gap-[0.5ch]">
          <ToolSlot textColor="text-green-500">
            <ToolButton
              onClick={() => {
                const width = 1920;
                const height = 1080;
                const id = crypto.randomUUID();
                createBlock({
                  id,
                  type: "webcam",
                  height,
                  width,
                  src: null,
                  crop: null,
                  x: -stateRef.camera.x - width / 2,
                  y: -stateRef.camera.y - height / 2,
                  zIndex: makeZIndex(),
                  blend: "darken",
                  flippedHorizontally: true,
                  flippedVertically: false,
                  originalMediaSize: null,
                });
                setSelectedBlockIds([id]);
              }}
            >
              Add Camera
            </ToolButton>
          </ToolSlot>
          <ToolSlot textColor="text-yellow-500">
            <ToolButton onClick={() => { }}>Add Image</ToolButton>
          </ToolSlot>
        </div>
      </div>

      <div className="absolute hidden pointer-events-none right-0 top-1/2 gap-[0.5ch] z-50 px-[0.5ch]">
        <div
          className="absolute right-0 active -translate-y-1/2 px-[2.5ch] pr-[2.5ch] pt-[1ch] pb-[2ch] flex flex-col gap-[0.5ch] bg-neutral-900 rounded-l-xl outline outline-[1px] outline-neutral-200"
          data-target="menu"
        >
          {showBlockMenu ? (
            <div className="w-[24ch] flex flex-col gap-[0.5ch]">
              {selectedBlockIds.length > 0 ? (
                <>
                  <ToolSlot>
                    {singleBlock
                      ? "BLOCK"
                      : `${selectedBlockIds.length} BLOCKS`}
                  </ToolSlot>
                  <ToolSlot>
                    <TwoUp>
                      <ToolValue
                        label="X"
                        value={Math.round(selectedBox.x)}
                        isInteractive
                        updater={(value) => {
                          const dx = value - selectedBox.x;
                          const newBlocks = selectedBlocks.map((block) => ({
                            ...block,
                            x: block.x + dx,
                          }));
                          updateBlocks(newBlocks);
                        }}
                      />
                      <ToolValue
                        label="Y"
                        value={Math.round(selectedBox.y)}
                        isInteractive
                        updater={(value) => {
                          const dy = value - selectedBox.y;
                          const newBlocks = selectedBlocks.map((block) => ({
                            ...block,
                            y: block.y + dy,
                          }));
                          updateBlocks(newBlocks);
                        }}
                      />
                    </TwoUp>
                  </ToolSlot>
                  <ToolSlot>
                    <TwoUp>
                      <ToolValue
                        label="W"
                        value={Math.round(selectedBox.width)}
                        isInteractive
                        min={minBlockSize}
                        updater={(value) => {
                          const newBlocks = selectedBlocks.map((block) => {
                            const minXRatio =
                              (block.x - selectedBox.x) / selectedBox.width;
                            const minYRatio =
                              (block.y - selectedBox.y) / selectedBox.height;
                            const widthRatio = block.width / selectedBox.width;
                            const heightRatio =
                              block.height / selectedBox.height;
                            const newBoxWidth = value;
                            const newBoxHeight =
                              newBoxWidth *
                              (selectedBox.height / selectedBox.width);
                            return {
                              ...block,
                              x: minXRatio * newBoxWidth + selectedBox.x,
                              y: minYRatio * newBoxHeight + selectedBox.y,
                              width: widthRatio * newBoxWidth,
                              height: heightRatio * newBoxHeight,
                            };
                          });
                          updateBlocks(newBlocks);
                        }}
                      />
                      <ToolValue
                        label="H"
                        value={Math.round(selectedBox.height)}
                        isInteractive
                        min={minBlockSize}
                        updater={(value) => {
                          const newBlocks = selectedBlocks.map((block) => {
                            const minXRatio =
                              (block.x - selectedBox.x) / selectedBox.width;
                            const minYRatio =
                              (block.y - selectedBox.y) / selectedBox.height;
                            const widthRatio = block.width / selectedBox.width;
                            const heightRatio =
                              block.height / selectedBox.height;
                            const newBoxHeight = value;
                            const newBoxWidth =
                              newBoxHeight *
                              (selectedBox.width / selectedBox.height);
                            return {
                              ...block,
                              x: minXRatio * newBoxWidth + selectedBox.x,
                              y: minYRatio * newBoxHeight + selectedBox.y,
                              width: widthRatio * newBoxWidth,
                              height: heightRatio * newBoxHeight,
                            };
                          });
                          updateBlocks(newBlocks);
                        }}
                      />
                    </TwoUp>
                  </ToolSlot>
                </>
              ) : null}

              {selectedBlocks.length ? (
                <ToolSlot>
                  {singleBlock?.type === "webcam" ? (
                    <span className="text-green-500">CAMERA</span>
                  ) : null}

                  {singleBlock?.type === "image" ? (
                    <span className="text-yellow-500">IMAGE</span>
                  ) : null}
                </ToolSlot>
              ) : null}

              {webcamIsSelected && devices.length > 1 && (
                <ToolSlot textColor="text-green-500">
                  <ToolCameraSelector webcamBlocks={selectedWebcamBlocks} />
                </ToolSlot>
              )}

              {singleBlock?.type === "webcam" ? (
                <TwoUp>
                  <ToolSlot textColor="text-green-500">
                    <ToolValue
                      label="W"
                      key={singleBlock.originalMediaSize?.width}
                      value={
                        singleBlock.originalMediaSize
                          ? Math.round(singleBlock.originalMediaSize.width)
                          : 0
                      }
                    />
                  </ToolSlot>
                  <ToolSlot textColor="text-green-500">
                    <ToolValue
                      label="H"
                      key={singleBlock.originalMediaSize?.height}
                      value={
                        singleBlock.originalMediaSize
                          ? Math.round(singleBlock.originalMediaSize.height)
                          : 0
                      }
                    />
                  </ToolSlot>
                </TwoUp>
              ) : null}

              {singleBlock?.type === "image" ? (
                <ToolSlot textColor="text-yellow-500">
                  <TwoUp>
                    <ToolValue
                      label="W"
                      key={singleBlock.originalMediaSize?.width}
                      value={
                        singleBlock.originalMediaSize
                          ? Math.round(singleBlock.originalMediaSize.width)
                          : 0
                      }
                    />
                    <ToolValue
                      label="H"
                      key={singleBlock.originalMediaSize?.height}
                      value={
                        singleBlock.originalMediaSize
                          ? Math.round(singleBlock.originalMediaSize.height)
                          : 0
                      }
                    />
                  </TwoUp>
                </ToolSlot>
              ) : null}

              {singleBlockSelected ? (
                <ToolSlot
                  textColor={
                    singleBlock?.type === "webcam"
                      ? "text-green-500"
                      : "text-yellow-500"
                  }
                >
                  <ToolFlipper blocks={selectedBlocks} />
                </ToolSlot>
              ) : null}

              {singleBlockSelected ? (
                <>
                  <ToolSlot textColor="text-blue-500">
                    <div className="flex gap-[1ch] items-baseline grow">
                      <div>CROP</div>
                    </div>
                  </ToolSlot>
                  {singleBlock?.crop ? null : (
                    <ToolSlot textColor="text-blue-500">
                      <ToolButton
                        onClick={() => {
                          setShowCropModal(true);
                        }}
                      >
                        Add
                      </ToolButton>
                    </ToolSlot>
                  )}
                </>
              ) : null}

              {singleBlock?.crop ? (
                <>
                  <ToolSlot textColor="text-blue-500">
                    <TwoUp>
                      <ToolValue
                        label="X"
                        value={Math.round(singleBlock.crop.x) || 0}
                        isInteractive
                      />
                      <ToolValue
                        label="Y"
                        value={Math.round(singleBlock.crop.y) || 0}
                        isInteractive
                      />
                    </TwoUp>
                  </ToolSlot>
                  <ToolSlot textColor="text-blue-500">
                    <TwoUp>
                      <ToolValue
                        label="W"
                        value={Math.round(singleBlock.crop.width) || 0}
                        isInteractive
                      />
                      <ToolValue
                        label="H"
                        value={Math.round(singleBlock.crop.height) || 0}
                        isInteractive
                      />
                    </TwoUp>
                  </ToolSlot>
                  <ToolSlot textColor="text-blue-500">
                    <TwoUp>
                      <div className="grow flex text-red-500">
                        <ToolButton
                          onClick={() => {
                            const scaleX =
                              singleBlock.width / singleBlock.crop!.width;
                            const scaleY =
                              singleBlock.height / singleBlock.crop!.height;
                            updateBlocks([
                              {
                                ...singleBlock,
                                crop: null,
                                x: singleBlock.x - singleBlock.crop!.x * scaleX,
                                y: singleBlock.y - singleBlock.crop!.y * scaleY,
                                width:
                                  singleBlock.originalMediaSize!.width * scaleX,
                                height:
                                  singleBlock.originalMediaSize!.height *
                                  scaleY,
                              } as BlockType,
                            ]);
                          }}
                        >
                          Clear
                        </ToolButton>
                      </div>
                      <ToolButton
                        onClick={() => {
                          setShowCropModal(true);
                        }}
                      >
                        Edit
                      </ToolButton>
                    </TwoUp>
                  </ToolSlot>
                </>
              ) : null}

              {selectedBlocks.length ? (
                <>
                  <ToolSlot textColor="text-purple-400">SAVE SELECTED</ToolSlot>
                  <ToolSlot textColor="text-purple-400">
                    <ToolDownload mode="selected" />
                  </ToolSlot>

                  <ToolSlot>BLEND</ToolSlot>
                  <ToolSlot>
                    <ToolSelect
                      onChange={(event) => {
                        const newBlend = event.target.value;
                        const newBlocks = selectedBlocks.map(
                          (block) =>
                            ({
                              ...block,
                              blend: newBlend,
                            }) as BlockType,
                        );
                        updateBlocks(newBlocks);
                      }}
                    >
                      {blendOptions.map((option) => (
                        <ToolSelectOption
                          key={option}
                          value={option}
                          label={option}
                        />
                      ))}
                    </ToolSelect>
                  </ToolSlot>
                </>
              ) : null}

              {selectedBlocks.length ? (
                <>
                  <ToolSlot>ACTIONS</ToolSlot>
                  <ToolSlot>
                    <TwoUp>
                      <ToolButton onClick={duplicateSelectedBlocks}>
                        Duplicate
                      </ToolButton>
                      <div className="w-full flex text-red-500">
                        <ToolButton onClick={deleteSelectedBlocks}>
                          Delete
                        </ToolButton>
                      </div>
                    </TwoUp>
                  </ToolSlot>
                  {numberWebcamBlocksSelected > 0 ? (
                    <ToolSlot textColor="text-yellow-500">
                      <ToolButton onClick={handleStamp}>Stamp</ToolButton>
                    </ToolSlot>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : (
            <ToolSlot>
              <ToolButton
                onClick={() => {
                  setShowBlockMenu((prev) => !prev);
                }}
              >
                Menu
              </ToolButton>
            </ToolSlot>
          )}
        </div>
      </div>
    </>
  );
}
