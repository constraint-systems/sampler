import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  SelectedBlockIdsAtom,
  showCropModalAtom,
  stampMoveDirectionAtom,
  stampMoveOffsetAtom,
} from "./atoms";
import { useDevices } from "./useDevices";
import { useStream } from "./useStream";
import { FlipHorizontal2, FlipVertical2 } from "lucide-react";
import { v4 as uuid } from "uuid";
import { makeZIndex } from "./utils";
import {
  BlendTypes,
  ImageBlockType,
  StampMoveDirectionType,
  StampMoveOffsetType,
} from "./types";
import { blendOptions, offsetLookup } from "./consts";

export function Toolbar() {
  const [blockIds, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setShowCropModal] = useAtom(showCropModalAtom);
  const [blockMap, setBlockMap] = useAtom(BlockMapAtom);
  const [, setCamera] = useAtom(CameraAtom);
  const [selectedBlockIds, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [stampMoveDirection, setStampMoveDirection] = useAtom(
    stampMoveDirectionAtom,
  );
  const [stampMoveOffset, setStampMoveOffset] = useAtom(stampMoveOffsetAtom);
  const {
    devices,
    selectedDeviceIndex,
    setSelectedDeviceIndex,
    selectedDeviceLabel,
    cameraSettings,
    setCameraSettings,
  } = useDevices();
  useStream();

  // useEffect(() => {
  //   function handleModifierDown(event: KeyboardEvent) {}
  //   function handleModifierUp(event: KeyboardEvent) {}
  //   window.addEventListener("keydown", handleModifierDown);
  //   window.addEventListener("keyup", handleModifierUp);
  //   return () => {
  //     window.removeEventListener("keydown", handleModifierDown);
  //     window.removeEventListener("keyup", handleModifierUp);
  //   };
  // }, [mode, setMode]);

  const cameraBlockId = useMemo(() => {
    return blockIds.find((id: string) => {
      const block = blockMap[id];
      return block.type === "webcam" ? block : null;
    });
  }, [blockIds, blockMap]);

  const cameraBlockSelected = useMemo(() => {
    return selectedBlockIds.some((id) => {
      const block = blockMap[id];
      return block.type === "webcam" ? block : null;
    });
  }, [selectedBlockIds, blockMap]);
  const selectedBlock =
    selectedBlockIds.length === 1 ? blockMap[selectedBlockIds[0]] : null;

  return (
    <>
      <div className="absolute left-0 bottom-0 w-full">
        <div className="flex flex-wrap">
          {cameraBlockSelected ? (
            <>
              {devices.length > 0 ? (
                devices.length > 1 ? (
                  <div className="flex flex-col">
                    {devices.map((device, index) => (
                      <button
                        className={`px-3 text-left py-2 ${index === selectedDeviceIndex ? "bg-neutral-700" : "bg-neutral-800"} hover:bg-neutral-700`}
                        value={index}
                        key={device.deviceId}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDeviceIndex(index);
                        }}
                      >
                        {device.label.split('(')[0].trim() || `Camera ${index}`}
                      </button>
                    ))}
                  </div>
                ) : null
              ) : null}
              <div className="flex flex-col">
                {blendOptions.map((item) => (
                  <button
                    key={item}
                    className={`px-3 text-left ${item === blockMap[cameraBlockId!].blend ? "bg-neutral-700" : "bg-neutral-800"} hover:bg-neutral-700`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setBlockMap((prev) => {
                        const block = prev[cameraBlockId!];
                        return {
                          ...prev,
                          [cameraBlockId!]: {
                            ...block,
                            blend: item as BlendTypes,
                          },
                        };
                      });
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                className="px-3 py-2 pointer-events-auto bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center"
                onClick={() => {
                  if (selectedDeviceLabel) {
                    setCameraSettings((prev) => ({
                      ...prev,
                      [selectedDeviceLabel]: {
                        ...prev[selectedDeviceLabel],
                        flipHorizontal: !cameraSettings.flipHorizontal,
                      },
                    }));
                  }
                }}
              >
                <FlipHorizontal2 size={14} />
              </button>
              <button
                className="px-3 py-2 pointer-events-auto bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center"
                onClick={() => {
                  if (selectedDeviceLabel) {
                    setCameraSettings((prev) => ({
                      ...prev,
                      [selectedDeviceLabel]: {
                        ...prev[selectedDeviceLabel],
                        flipVertical: !cameraSettings.flipVertical,
                      },
                    }));
                  }
                }}
              >
                <FlipVertical2 size={14} />
              </button>
              <button
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700"
                onClick={() => setShowCropModal(true)}
              >
                crop
              </button>
              <div className="grid grid-cols-3">
                {["↖", "↑", "↗", "←", "•", "→", "↙", "↓", "↘"].map(
                  (value) => (
                    <button
                      className={`px-2 ${
                        stampMoveDirection === value
                          ? "bg-neutral-700"
                          : "bg-neutral-800"
                      } hover:bg-neutral-700 flex justify-center items-center`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStampMoveDirection(value as StampMoveDirectionType);
                      }}
                    >
                      {value}
                    </button>
                  ),
                )}
              </div>
              <div className="flex flex-col">
                {["1/4", "1/2", "3/4", "1"].map((offset) => {
                  return (
                    <button
                      className={`px-3 ${
                        stampMoveOffset === offset
                          ? "bg-neutral-700"
                          : "bg-neutral-800"
                      } hover:bg-neutral-700 flex justify-center items-center`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStampMoveOffset(offset as StampMoveOffsetType);
                      }}
                      value={offset}
                    >
                      {offset}
                    </button>
                  );
                })}
              </div>
              <button
                className="px-3 py-2 pointer-events-auto bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!cameraBlockId) return;

                  let horizontalMove = 0;
                  let verticalMove = 0;
                  if (
                    stampMoveDirection === "←" ||
                    stampMoveDirection === "↖" ||
                    stampMoveDirection === "↙"
                  ) {
                    horizontalMove = -1 * offsetLookup[stampMoveOffset];
                  }
                  if (
                    stampMoveDirection === "→" ||
                    stampMoveDirection === "↗" ||
                    stampMoveDirection === "↘"
                  ) {
                    horizontalMove = 1 * offsetLookup[stampMoveOffset];
                  }
                  if (
                    stampMoveDirection === "↑" ||
                    stampMoveDirection === "↖" ||
                    stampMoveDirection === "↗"
                  ) {
                    verticalMove = -1 * offsetLookup[stampMoveOffset];
                  }
                  if (
                    stampMoveDirection === "↓" ||
                    stampMoveDirection === "↙" ||
                    stampMoveDirection === "↘"
                  ) {
                    verticalMove = 1 * offsetLookup[stampMoveOffset];
                  }
                  if (stampMoveDirection === "•") {
                    horizontalMove = 0;
                    verticalMove = 0;
                  }
                  const block = blockMap[cameraBlockId];
                  const canvas = document.getElementById(
                    "canvas-" + block.id,
                  ) as HTMLCanvasElement;
                  const dataUrl = canvas.toDataURL();
                  const newId = uuid();
                  const newBlock = {
                    id: newId,
                    x: block.x,
                    y: block.y,
                    width: block.width,
                    height: block.height,
                    rotation: block.rotation,
                    src: dataUrl,
                    blend: block.blend,
                    type: "image",
                    zIndex: makeZIndex(),
                  } as ImageBlockType;
                  setBlockIds((prev) => [...prev, newId]);
                  setBlockMap((prev) => ({
                    ...prev,
                    [newId]: newBlock,
                    [block.id]: {
                      ...block,
                      x: block.x + block.width * horizontalMove,
                      y: block.y + block.height * verticalMove,
                      zIndex: makeZIndex() + 1,
                    },
                  }));
                  setCamera((prev) => {
                    return {
                      ...prev,
                      x: prev.x - block.width * horizontalMove,
                      y: prev.y - block.height * verticalMove,
                    };
                  });
                }}
              >
                stamp
              </button>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap">
          {selectedBlockIds.length > 0 ? (
            <div className="px-3 py-2">{`${selectedBlockIds.length} selected`}</div>
          ) : (
            <div className="px-3 py-2">{`0 selected`}</div>
          )}
          {selectedBlock ? (
            <div className="px-3 py-2">
              {Math.round(selectedBlock.x)}, {Math.round(selectedBlock.y)}{" "}
              {Math.round(selectedBlock.width)}x
              {Math.round(selectedBlock.height)}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
