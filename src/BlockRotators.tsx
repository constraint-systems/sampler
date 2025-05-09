import { useAtom } from "jotai";
import { useRef } from "react";
import { BlockMapAtom, CameraAtom, ZoomContainerAtom } from "./atoms";
import { useDrag } from "@use-gesture/react";
import { screenToCanvas } from "./Camera";

export function BlockRotators({ id }: { id: string }) {
  const [blockMap, setBlockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];

  const [camera] = useAtom(CameraAtom);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const [zoomContainer] = useAtom(ZoomContainerAtom);
  const zoomContainerRef = useRef(zoomContainer);
  zoomContainerRef.current = zoomContainer;

  const size = 20;

  const startingBlockAngleRef = useRef(block.rotation);
  const startAngleRef = useRef(0);
  const oppositeCornerRef = useRef({ x: 0, y: 0 });

  const dragBind = useDrag(({ first, event, xy: [x, y] }) => {
    event.stopPropagation();

    if (event.altKey) {
      const angle =
        Math.atan2(canvasPoint.y - centerY, canvasPoint.x - centerX) +
        Math.PI / 4;
      if (first) {
        startingBlockAngleRef.current = block.rotation || 0;
        startAngleRef.current = angle;

        // rotated corner point
        oppositeCornerRef.current = {
          x: block.x + block.width,
          y: block.y + block.height,
        };
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
    } else {
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

        // rotated corner point
        oppositeCornerRef.current = {
          x: block.x + block.width,
          y: block.y + block.height,
        };
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
    }
  });

  return (
    <>
      <div
        {...dragBind()}
        className="absolute opacity-0 touch-none pointer-events-auto border-blue-500 border-2 rounded-full bg-black"
        style={{
          left: `calc(50% - ${size / 2}px)`,
          top: -size / 2 - 24,
          cursor: "grabbing",
          width: size,
          height: size,
        }}
      />
    </>
  );
}
