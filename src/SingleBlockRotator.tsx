import { useDrag } from "@use-gesture/react";
import { useAtom } from "jotai";
import { useRef } from "react";
import {
  SelectedBlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  ZoomContainerAtom,
} from "./atoms";
import { screenToCanvas } from "./Camera";

export function SingleBlockRotator() {
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [blockMap, setBlockMap] = useAtom(BlockMapAtom);
  const block = blockMap[selectedBlockIds[0]];
  const id = block.id;

  const [camera] = useAtom(CameraAtom);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const [zoomContainer] = useAtom(ZoomContainerAtom);
  const zoomContainerRef = useRef(zoomContainer);
  zoomContainerRef.current = zoomContainer;

  const offset = 16;
  const size = 16;

  const startingBlockAngleRef = useRef(block.rotation);
  const startAngleRef = useRef(0);

  const dragBind = useDrag(({ first, event, xy: [x, y] }) => {
    event.stopPropagation();

    // resizing rotation from https://shihn.ca/posts/2020/resizing-rotated-elements/
    const centerX = block.x + block.width / 2;
    const centerY = block.y + block.height / 2;
    const canvasPoint = screenToCanvas(
      { x, y },
      cameraRef.current,
      zoomContainerRef.current!,
    );
    const angle =
      Math.atan2(canvasPoint.y - centerY, canvasPoint.x - centerX) +
      Math.PI / 4;
    if (first) {
      startingBlockAngleRef.current = block.rotation || 0;
      startAngleRef.current = angle;
    }
    const newAngle =
      startingBlockAngleRef.current + (angle - startAngleRef.current);
    setBlockMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        rotation: newAngle,
      },
    }));
  });

  const scaledSize = Math.max(8, size / camera.z);
  const scaledOffset = Math.max(offset, offset / camera.z)

  return (
    <div
      {...dragBind()}
      className="absolute border-blue-500 rounded-full touch-none pointer-events-auto"
      style={{
        borderWidth: Math.max(2, 2 / camera.z),
        left: block.width / 2 - scaledSize / 2,
        top: -scaledSize / 2 - scaledOffset,
        cursor: "grab",
        width: scaledSize,
        height: scaledSize,
      }}
    />
  );
}
