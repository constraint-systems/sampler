import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  ControlDownAtom,
  devicesAtom,
  RedoStackAtom,
  SelectedBlockIdsAtom,
  showCropModalAtom,
  StampDirectionAtom,
  StateRefAtom,
  ShowBlockMenuAtom,
  UndoStackAtom,
} from "./atoms";
import { useApplyHistoryState } from "./history/useApplyHistoryState";
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

export function Toolbar() {
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setCamera] = useAtom(CameraAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [showCropModal, setShowCropModal] = useAtom(showCropModalAtom);
  const [stampDirection, setStampDirection] = useAtom(StampDirectionAtom);
  const [undoStack, setUndoStack] = useAtom(UndoStackAtom);
  const [controlDown] = useAtom(ControlDownAtom);
  const [redoStack, setRedoStack] = useAtom(RedoStackAtom);
  const applyHistoryState = useApplyHistoryState();
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
  const isAllWebcamBlocks = selectedBlocks.every(
    (block) => block.type === "webcam",
  );
  const isAllImageBlocks = selectedBlocks.every(
    (block) => block.type === "image",
  );
  const singleBlock = singleBlockSelected ? selectedBlocks[0] : null;

  const color = isAllWebcamBlocks
    ? "text-red-500"
    : isAllImageBlocks
      ? "text-yellow-500"
      : "text-orange-500";

  const scale = Math.max(Math.min(1 / camera.z, 8), 0.5);
  // const scaleRatio = ((scale - 0.5) / 7.5);
  // console.log("scaleRatio", scaleRatio);

  return (
    <>
      <div
        className="absolute pointer-events-none left-0 top-0 w-[24ch] gap-[0.5ch] flex flex-col z-50 px-[0.5ch]"
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

      {false && showBlockMenu ? (
        <div
          className="absolute pointer-events-none left-0 top-0 w-[26ch] gap-[0.5ch] flex flex-col z-50 px-[0.5ch]"
          style={{
            transformOrigin: "0 0",
            transform: `translate(${selectedBox.x + selectedBox.width}px, ${selectedBox.y + selectedBox.height / 2}px) scale(${scale})`,
            display: blocksAreSelected ? "flex" : "none",
          }}
        >
          <div className="absolute left-[24px] -translate-y-1/2 px-[2ch] pt-[1ch] pb-[1.5ch] flex flex-col gap-[0.5ch] bg-black outline outline-[2px] outline-neutral-500">
            {selectedBlockIds.length > 0 ? (
              <>
                <ToolSlot>
                  {singleBlock ? "BLOCK" : `${selectedBlockIds.length} BLOCKS`}
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
                          const heightRatio = block.height / selectedBox.height;
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
                          const heightRatio = block.height / selectedBox.height;
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
              <ToolSlot textColor={color}>
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
                    <div>
                      <span
                        className={`outline-blue-500 outline-1 outline px-[0.25ch] ${controlDown ? "bg-blue-500 text-black" : "text-blue-500"}`}
                      >
                        control
                      </span>
                    </div>
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
                                singleBlock.originalMediaSize!.height * scaleY,
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
                    <ToolButton onClick={handleStamp}>
                      Stamp{" "}
                      <span className="outline-current outline outline-1 px-[0.5ch]">
                        space
                      </span>
                    </ToolButton>
                  </ToolSlot>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      <div
        className="absolute pointer-events-none left-0 top-0 w-[40ch] gap-[0.5ch] flex flex-col z-50 px-[0.5ch]"
        style={{
          transformOrigin: "0 0",
          transform: `translate(${allBlockBounds.x + allBlockBounds.width + 24 / camera.z}px, ${0}px) scale(${Math.max(
            Math.min(1 / camera.z, 8),
            0.5,
          )})`,
        }}
      >
        <div
          className="absolute left-0 w-full -translate-y-1/2 px-[1.5ch] py-[1ch] flex-col flex gap-[0.5ch]"
          style={{
            lineHeight: "1.5",
          }}
        >
          <div>CONTROLS</div>
          <div>MOUSE</div>
          <div>
            <span className="outline outline-1 px-[0.5ch] outline-neutral-200">
              scroll
            </span>{" "}
            pan
          </div>
          <div>
            └{" "}
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              control
            </span>
            zoom
          </div>
          <div>
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              click & drag
            </span>
            select or move
          </div>
          <div>
            └{" "}
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              alt
            </span>
            clone
          </div>
          <div className="text-yellow-500">
            └{" "}
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              alt
            </span>
            +{" "}
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              shift
            </span>
            stamp
          </div>
          <div className="text-blue-500">
            └{" "}
            <span className="outline outline-[1px] px-[0.5ch] outline-current mr-[1ch]">
              control
            </span>
            draw or pan crop
          </div>
          <div className="text-blue-500">
            <span className="outline outline-[1px] px-[0.5ch] outline-current mr-[1ch]">
              double click
            </span>
            add or edit crop
          </div>

          <div>KEYBOARD</div>
          <div className="text-green-500">
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              c
            </span>
            next camera
          </div>
          <div className="text-green-500">
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              h
            </span>
            flip horizontally
          </div>
          <div className="text-green-500">
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              v
            </span>
            flip vertically
          </div>
          <div className="text-blue-500">
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              enter
            </span>
            add or edit crop
          </div>
          <div>
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              b
            </span>
            next blend mode
          </div>
          <div>
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              d
            </span>
            duplicate
          </div>
          <div className="text-red-500">
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              backspace
            </span>
            delete
          </div>
          <div className="text-yellow-500">
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              space
            </span>
            stamp
          </div>
          <div className="text-purple-400">
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              s
            </span>
            save selected as JPG
          </div>
          <div className="text-purple-400">
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              shift + s
            </span>
            save canvas as JPG
          </div>
          <div>
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              /
            </span>
            toggle block menu
          </div>
          <div>
            <span className="outline outline-1 px-[0.5ch] outline-current mr-[1ch]">
              ?
            </span>
            toggle canvas menu
          </div>
        </div>
      </div>

      <div
        className="absolute pointer-events-none left-0 top-0 w-[24ch] gap-[0.5ch] flex flex-col z-50 px-[0.5ch]"
        style={{
          transformOrigin: "0 0",
          transform: `translate(${allBlockBounds.x - 24 / camera.z}px, ${0}px) scale(${Math.max(
            Math.min(1 / camera.z, 8),
            0.5,
          )})`,
        }}
      >
        <div
          className="absolute left-0 w-full -translate-x-full -translate-y-1/2 px-[1.5ch] py-[1ch] flex-col flex gap-[0.5ch] active"
          data-target="menu"
        >
          <ToolSlot>SAMPLER</ToolSlot>
          <div style={{ lineHeight: "1.5" }}>
            A tool for collaging <span className="text-green-500">webcam</span>{" "}
            and <span className="text-yellow-500">image</span> blocks.
          </div>
          <div style={{ lineHeight: "1.5" }}>
            <a
              href="https://constraint.systems"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-orange-500"
            >
              constraint.systems ↗
            </a>
          </div>
          <ToolSlot>BLOCKS</ToolSlot>
          <ToolSlot textColor="text-green-500">
            {selectedWebcamBlocks.length} CAMERA
            {selectedWebcamBlocks.length !== 1 ? "S" : ""}
          </ToolSlot>
          <ToolSlot textColor="text-yellow-500">
            {selectedImageBlocks.length} IMAGE
            {selectedImageBlocks.length !== 1 ? "S" : ""}
          </ToolSlot>
          <ToolSlot>ZOOM</ToolSlot>
          <ToolSlot>
            <ToolValue
              label="z"
              isInteractive
              value={Math.round(camera.z * 100)}
              formatter={(value) => `${value}%`}
              shiftStep={10}
              step={1}
              updater={(newValue) => {
                setCamera({
                  ...stateRef.camera,
                  z: newValue / 100,
                });
              }}
            />
          </ToolSlot>
          <ToolSlot>CANVAS</ToolSlot>
          <ToolSlot>
            <TwoUp>
              <ToolValue
                isInteractive
                label="W"
                value={Math.round(allBlockBounds.width)}
              />
              <ToolValue
                isInteractive
                label="H"
                value={Math.round(allBlockBounds.height)}
              />
            </TwoUp>
          </ToolSlot>
          <ToolSlot textColor="text-purple-400">SAVE CANVAS</ToolSlot>
          <ToolSlot textColor="text-purple-400">
            <ToolDownload mode="all" />
          </ToolSlot>
        </div>
      </div>
      <div
        className="absolute pointer-events-none right-0 top-1/2 gap-[0.5ch] z-50 px-[0.5ch]"
        style={{
          transformOrigin: "0 0",
          transform: `translate(${selectedBox.x + selectedBox.width}px, ${selectedBox.y + selectedBox.height / 2}px) scale(${scale})`,
          display: blocksAreSelected ? "flex" : "none",
        }}
      >
        <div
          className="absolute -right-[31ch] -translate-y-1/2 active px-[2.5ch] pr-[2.5ch] pt-[1ch] pb-[2ch] flex flex-col gap-[0.5ch] bg-neutral-900 rounded-xl outline outline-[1px] outline-neutral-200"
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
