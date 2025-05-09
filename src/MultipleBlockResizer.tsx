import { useDrag } from "@use-gesture/react";
import { useAtom } from "jotai";
import {
  SelectedBlockIdsAtom,
  BlockMapAtom,
  StateRefAtom,
  CameraAtom,
} from "./atoms";
import { screenToCanvas } from "./Camera";
import { BlockSelectorType } from "./types";

export function MultipleBlockResizer({
  blockSelector,
}: {
  blockSelector: BlockSelectorType;
}) {
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [camera] = useAtom(CameraAtom);
  const size = 16;
  const corners = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ] as const;
  const [stateRef] = useAtom(StateRefAtom);

  const dragBind = useDrag(({ event, xy: [x, y] }) => {
    event.stopPropagation();
    const corner = (event.currentTarget as HTMLDivElement).dataset.corner;

    const activePoint = screenToCanvas(
      { x, y },
      stateRef.camera,
      stateRef.zoomContainer!,
    );

    const startX = blockSelector.x;
    const startY = blockSelector.y;
    const startWidth = blockSelector.width;
    const startHeight = blockSelector.height;

    let pinnedCornerX = blockSelector.x;
    let pinnedCornerY = blockSelector.y;

    let proposedWidth = startWidth;
    let proposedHeight = startHeight;
    if (corner === "top-left") {
      pinnedCornerX = blockSelector.x + startWidth;
      pinnedCornerY = blockSelector.y + startHeight;
      proposedWidth = pinnedCornerX - activePoint.x;
      proposedHeight = pinnedCornerY - activePoint.y;
    } else if (corner === "top-right") {
      pinnedCornerX = blockSelector.x;
      pinnedCornerY = blockSelector.y + startHeight;
      proposedWidth = activePoint.x - pinnedCornerX;
      proposedHeight = pinnedCornerY - activePoint.y;
    } else if (corner === "bottom-left") {
      pinnedCornerX = blockSelector.x + startWidth;
      pinnedCornerY = blockSelector.y;
      proposedWidth = pinnedCornerX - activePoint.x;
      proposedHeight = activePoint.y - pinnedCornerY;
    } else if (corner === "bottom-right") {
      pinnedCornerX = blockSelector.x;
      pinnedCornerY = blockSelector.y;
      proposedWidth = activePoint.x - pinnedCornerX;
      proposedHeight = activePoint.y - pinnedCornerY;
    }

    const aspectRatio = startWidth / startHeight;
    const newAspectRatio = Math.abs(proposedWidth / proposedHeight);
    if (newAspectRatio < aspectRatio) {
      proposedWidth = proposedHeight * aspectRatio;
    } else {
      proposedHeight = proposedWidth / aspectRatio;
    }

    let newX = blockSelector.x;
    let newY = blockSelector.y;
    if (corner === "top-left") {
      newX = pinnedCornerX - proposedWidth;
      newY = pinnedCornerY - proposedHeight;
    } else if (corner === "top-right") {
      newX = pinnedCornerX;
      newY = pinnedCornerY - proposedHeight;
    } else if (corner === "bottom-left") {
      newX = pinnedCornerX - proposedWidth;
      newY = pinnedCornerY;
    } else if (corner === "bottom-right") {
      newX = pinnedCornerX;
      newY = pinnedCornerY;
    }

    const scaleX = proposedWidth / startWidth;
    const scaleY = proposedHeight / startHeight;
    for (let i = 0; i < selectedBlockIds.length; i++) {
      const id = selectedBlockIds[i];
      setBlockMap((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          x: (prev[id].x - startX) * scaleX + newX,
          y: (prev[id].y - startY) * scaleY + newY,
          width: prev[id].width * scaleX,
          height: prev[id].height * scaleY,
        },
      }));
    }
  });

  const cornerCursors = {
    "top-right": "nesw-resize",
    "top-left": "nwse-resize",
    "bottom-right": "nwse-resize",
    "bottom-left": "nesw-resize",
  };

  const scaledSize = size / camera.z;

  return (
    <>
      {[...corners].map((corner) => {
        return (
          <div
            {...dragBind()}
            key={corner}
            data-corner={corner}
            className="absolute border-blue-500 touch-none pointer-events-auto"
            style={{
              borderWidth: Math.max(2, 2 / camera.z),
              left:
                corner === "top-left" || corner === "bottom-left"
                  ? -scaledSize / 2
                  : blockSelector.width - scaledSize / 2,
              top:
                corner === "top-left" || corner === "top-right"
                  ? -scaledSize / 2
                  : blockSelector.height - scaledSize / 2,
              cursor: cornerCursors[corner],
              width: scaledSize,
              height: scaledSize,
            }}
          />
        );
      })}
    </>
  );
}
