import { useAtom } from "jotai";
import { BlockMapAtom, CameraAtom, SelectedBlockIdsAtom } from "./atoms";
import { sides } from "./consts";
import { getBoxBoundsFromBlocks } from "./utils";

export function SelectedBox() {
  const [blockMap] = useAtom(BlockMapAtom);
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [camera] = useAtom(CameraAtom);

  const selectedBlocks = selectedBlockIds.map((id) => blockMap[id]);
  const { x, y, width, height } = getBoxBoundsFromBlocks(selectedBlocks);
  const isAllWebcamBlocks = selectedBlocks.every(
    (block) => block.type === "webcam",
  );
  const isAllImageBlocks = selectedBlocks.every(
    (block) => block.type === "image",
  );
  let color = "orange-500";
  if (isAllWebcamBlocks) {
    color = "red-500";
  } else if (isAllImageBlocks) {
    color = "yellow-500";
  }

  if (selectedBlockIds.length === 0) {
    return null;
  }

  const offset = 3;
  const doubleOffset = offset * 2;

  return (
    <>
      <div
        className="absolute"
        data-target="selected-box"
        style={{
          left: x - Math.max(offset, offset / camera.z),
          top: y - Math.max(offset, offset / camera.z),
          width: width + Math.max(doubleOffset, doubleOffset / camera.z),
          height: height + Math.max(doubleOffset, doubleOffset / camera.z),
        }}
      >
        <ResizeSides color={color} />
        <ResizeCorners color={color} />
      </div>
    </>
  );
}

function ResizeSides({ color }: { color: string }) {
  const [camera] = useAtom(CameraAtom);
  const sideWidth = Math.max(16, 16 / camera.z);
  const borderWidth = Math.max(2, 2 / camera.z);
  const cornerSize = Math.max(16, Math.round(16 / camera.z));

  return (
    <>
      {sides.map((side) => {
        const cursors = {
          top: "ns-resize",
          right: "ew-resize",
          bottom: "ns-resize",
          left: "ew-resize",
        };
        const cursor = cursors[side as keyof typeof cursors];
        const width =
          side === "top" || side === "bottom"
            ? `calc(100% - ${cornerSize}px)`
            : sideWidth;
        const height =
          side === "left" || side === "right"
            ? `calc(100% - ${cornerSize}px)`
            : sideWidth;
        const positionStyles = {
          top: {
            top: -sideWidth / 2,
            left: cornerSize / 2,
            width,
            height: sideWidth,
          },
          right: {
            right: -sideWidth / 2,
            top: cornerSize / 2,
            width: sideWidth,
            height,
          },
          bottom: {
            bottom: -sideWidth / 2,
            left: cornerSize / 2,
            width,
            height: sideWidth,
          },
          left: {
            left: -sideWidth / 2,
            top: cornerSize / 2,
            width: sideWidth,
            height,
          },
        }[side];
        return (
          <div
            key={side}
            className={`active flex items-center justify-center absolute ${side}`}
            data-target={`resize-side-${side}`}
            style={{
              ...positionStyles,
              cursor: cursor,
            }}
          >
            <div
              className={`pointer-events-none bg-white`}
              style={{
                width:
                  side === "top" || side === "bottom" ? "100%" : borderWidth,
                height:
                  side === "left" || side === "right" ? "100%" : borderWidth,
              }}
            />
          </div>
        );
      })}
    </>
  );
}

function ResizeCorners({ color }: { color: string }) {
  const [camera] = useAtom(CameraAtom);
  const cornerSize = Math.max(16, Math.round(16 / camera.z));
  const borderWidth = Math.max(2, 2 / camera.z);

  return (
    <>
      {["top-left", "top-right", "bottom-right", "bottom-left"].map(
        (corner) => {
          const cursors = {
            "top-left": "nwse-resize",
            "top-right": "nesw-resize",
            "bottom-right": "nwse-resize",
            "bottom-left": "nesw-resize",
          };
          const cursor = cursors[corner as keyof typeof cursors];
          return (
            <div
              key={corner}
              className={`active bg-white absolute ${corner}`}
              data-target={`resize-corner-${corner}`}
              style={{
                width: cornerSize,
                height: cornerSize,
                cursor: cursor,
                borderRadius: "50%",
                [corner.split("-")[0]]: -cornerSize / 2,
                [corner.split("-")[1]]: -cornerSize / 2,
              }}
            />
          );
        },
      )}
    </>
  );
}
