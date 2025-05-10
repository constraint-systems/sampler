import { useDrag } from "@use-gesture/react";
import { useAtom } from "jotai";
import { useRef } from "react";
import {
  SelectedBlockIdsAtom,
  BlockMapAtom,
  StateRefAtom,
  CameraAtom,
} from "./atoms";
import { screenToCanvas } from "./Camera";
import { BlockSelectorType } from "./types";
import { rotateAroundCenter } from "./utils";

export function MultipleBlockRotator({
  blockSelector,
}: {
  blockSelector: BlockSelectorType;
}) {
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [blockMap, setBlockMap] = useAtom(BlockMapAtom);
  const offset = 16;
  const size = 16;
  const [stateRef] = useAtom(StateRefAtom);
  const [camera] = useAtom(CameraAtom);

  const startCenterRef = useRef({ x: 0, y: 0 });
  const startAngleRef = useRef(0);
  const startCentersRef = useRef<{ x: number; y: number }[]>([]);
  const startAnglesRef = useRef<number[]>([]);
  const dragBind = useDrag(({ first, event, xy: [x, y] }) => {
    event.stopPropagation();

    // resizing rotation from https://shihn.ca/posts/2020/resizing-rotated-elements/
    const canvasPoint = screenToCanvas(
      { x, y },
      stateRef.camera,
      stateRef.zoomContainer!,
    );

    if (first) {
      const selectorCenterX = blockSelector.x + blockSelector.width / 2;
      const selectorCenterY = blockSelector.y + blockSelector.height / 2;

      startCenterRef.current = {
        x: selectorCenterX,
        y: selectorCenterY,
      };
    }

    const angle =
      Math.atan2(
        canvasPoint.y - startCenterRef.current.y,
        canvasPoint.x - startCenterRef.current.x,
      ) -
      Math.PI / 4;

    if (first) {
      startAngleRef.current = angle;
      startCentersRef.current = selectedBlockIds.map((id) => {
        const block = blockMap[id];
        return {
          x: block.x + block.width / 2,
          y: block.y + block.height / 2,
        };
      });
      startAnglesRef.current = selectedBlockIds.map((id) => {
        const block = blockMap[id];
        return block.rotation || 0;
      });
    }

    let newAngle = angle - startAngleRef.current;

    if (event.shiftKey) {
      const step = Math.PI / 4;
      newAngle = Math.round(newAngle / step) * step;
    }

    const newBlockMap = { ...blockMap };
    if (event.altKey) {
      console.log("alt key pressed");
      for (let i = 0; i < selectedBlockIds.length; i++) {
        const id = selectedBlockIds[i];
        const block = newBlockMap[id];
        newBlockMap[id] = {
          ...block,
          rotation: startAnglesRef.current[i] + newAngle,
        };
      }
    } else {
      for (let i = 0; i < selectedBlockIds.length; i++) {
        const id = selectedBlockIds[i];
        const block = newBlockMap[id];
        const newCenter = rotateAroundCenter(
          startCentersRef.current[i].x,
          startCentersRef.current[i].y,
          startCenterRef.current.x,
          startCenterRef.current.y,
          newAngle,
        );
        newBlockMap[id] = {
          ...block,
          x: newCenter[0] - block.width / 2,
          y: newCenter[1] - block.height / 2,
          rotation: startAnglesRef.current[i] + newAngle,
        };
      }
    }
    setBlockMap(newBlockMap);
  });

  const scaledSize = Math.max(8, size / camera.z);
  const scaledOffset = Math.max(offset, offset / camera.z);

  return (
    <div
      {...dragBind()}
      className="absolute border-blue-500 rounded-full touch-none pointer-events-auto"
      style={{
        borderWidth: Math.max(2, 2 / camera.z),
        left: blockSelector.width / 2 - scaledSize / 2,
        top: -scaledSize / 2 - scaledOffset,
        cursor: "grab",
        width: scaledSize,
        height: scaledSize,
      }}
    />
  );
}
