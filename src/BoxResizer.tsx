import { useDrag } from "@use-gesture/react";
import { useAtom } from "jotai";
import { useRef } from "react";
import { BlockMapAtom, CameraAtom, ZoomContainerAtom } from "./atoms";
import { screenToCanvas } from "./Camera";
import { rotateAroundCenter } from "./utils";

const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];

export function BoxResizer({ id }: { id: string }) {
  const [blockMap, setBlockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];

  const [camera] = useAtom(CameraAtom);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const [zoomContainer] = useAtom(ZoomContainerAtom);
  const zoomContainerRef = useRef(zoomContainer);
  zoomContainerRef.current = zoomContainer;

  // reimplement?
  const preserveAspectRatio = block.type === "image" || block.type === "webcam";

  const size = 22;

  const dragBind = useDrag(({ event, xy: [x, y] }) => {
    event.stopPropagation();
    const corner = (event.currentTarget as HTMLDivElement).dataset.corner;

    const cx = block.x + block.width / 2;
    const cy = block.y + block.height / 2;

    const canvasPoint = screenToCanvas(
      { x, y },
      cameraRef.current,
      zoomContainerRef.current!,
    );
    const rotation = block.rotation || 0;

    // base rotated
    const unrotatedTopLeft = [block.x, block.y];
    const unrotatedTopRight = [block.x + block.width, block.y];
    const unrotatedBottomLeft = [block.x, block.y + block.height];
    const unrotatedBottomRight = [
      block.x + block.width,
      block.y + block.height,
    ];

    // base unrotated
    const rotatedTopLeft = rotateAroundCenter(
      block.x,
      block.y,
      cx,
      cy,
      rotation,
    );
    const rotatedTopRight = rotateAroundCenter(
      block.x + block.width,
      block.y,
      cx,
      cy,
      rotation,
    );
    const rotatedBottomLeft = rotateAroundCenter(
      block.x,
      block.y + block.height,
      cx,
      cy,
      rotation,
    );
    const rotatedBottomRight = rotateAroundCenter(
      block.x + block.width,
      block.y + block.height,
      cx,
      cy,
      rotation,
    );

    if (corner === "bottom-right") {
      const activeCorner = [canvasPoint.x, canvasPoint.y];
      const unrotatedActiveCorner = rotateAroundCenter(
        activeCorner[0],
        activeCorner[1],
        cx,
        cy,
        -rotation,
      );

      let proposedWidth = unrotatedActiveCorner[0] - unrotatedTopLeft[0];
      let proposedHeight = unrotatedActiveCorner[1] - unrotatedTopLeft[1];

      if (preserveAspectRatio) {
        const aspectRatio = block.width / block.height;
        const newAspectRatio = Math.abs(proposedWidth / proposedHeight);
        if (newAspectRatio < aspectRatio) {
          proposedHeight = proposedWidth / aspectRatio;
        } else {
          proposedWidth = proposedHeight * aspectRatio;
        }
      }

      const newCenterX = unrotatedTopLeft[0] + proposedWidth / 2;
      const newCenterY = unrotatedTopLeft[1] + proposedHeight / 2;

      const newRotatedTopLeft = rotateAroundCenter(
        block.x,
        block.y,
        newCenterX,
        newCenterY,
        rotation,
      );

      const adjustedX = newRotatedTopLeft[0] - rotatedTopLeft[0];
      const adjustedY = newRotatedTopLeft[1] - rotatedTopLeft[1];

      const newX = unrotatedTopLeft[0] - adjustedX;
      const newY = unrotatedTopLeft[1] - adjustedY;
      const newWidth = proposedWidth;
      const newHeight = proposedHeight;

      setBlockMap((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        },
      }));
    } else if (corner === "top-left") {
      const activeCorner = [canvasPoint.x, canvasPoint.y];
      const unrotatedActiveCorner = rotateAroundCenter(
        activeCorner[0],
        activeCorner[1],
        cx,
        cy,
        -rotation,
      );

      let proposedWidth = unrotatedBottomRight[0] - unrotatedActiveCorner[0];
      let proposedHeight = unrotatedBottomRight[1] - unrotatedActiveCorner[1];

      if (preserveAspectRatio) {
        const aspectRatio = block.width / block.height;
        const newAspectRatio = Math.abs(proposedWidth / proposedHeight);
        if (newAspectRatio < aspectRatio) {
          proposedHeight = proposedWidth / aspectRatio;
        } else {
          proposedWidth = proposedHeight * aspectRatio;
        }
      }

      const newCenterX = unrotatedBottomRight[0] - proposedWidth / 2;
      const newCenterY = unrotatedBottomRight[1] - proposedHeight / 2;

      const newRotatedBottomRight = rotateAroundCenter(
        block.x + block.width,
        block.y + block.height,
        newCenterX,
        newCenterY,
        rotation,
      );

      const adjustedX = newRotatedBottomRight[0] - rotatedBottomRight[0];
      const adjustedY = newRotatedBottomRight[1] - rotatedBottomRight[1];

      const newWidth = proposedWidth;
      const newHeight = proposedHeight;
      const newX = unrotatedBottomRight[0] - newWidth - adjustedX;
      const newY = unrotatedBottomRight[1] - newHeight - adjustedY;

      setBlockMap((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        },
      }));
    } else if (corner === "top-right") {
      const activeCorner = [canvasPoint.x, canvasPoint.y];
      const unrotatedActiveCorner = rotateAroundCenter(
        activeCorner[0],
        activeCorner[1],
        cx,
        cy,
        -rotation,
      );

      let proposedWidth = unrotatedActiveCorner[0] - unrotatedBottomLeft[0];
      let proposedHeight = unrotatedBottomLeft[1] - unrotatedActiveCorner[1];

      if (preserveAspectRatio) {
        const aspectRatio = block.width / block.height;
        const newAspectRatio = Math.abs(proposedWidth / proposedHeight);
        if (newAspectRatio < aspectRatio) {
          proposedHeight = proposedWidth / aspectRatio;
        } else {
          proposedWidth = proposedHeight * aspectRatio;
        }
      }

      const newCenterX = unrotatedBottomLeft[0] + proposedWidth / 2;
      const newCenterY = unrotatedBottomLeft[1] - proposedHeight / 2;

      const newRotatedBottomLeft = rotateAroundCenter(
        block.x,
        block.y + block.height,
        newCenterX,
        newCenterY,
        rotation,
      );

      const adjustedX = newRotatedBottomLeft[0] - rotatedBottomLeft[0];
      const adjustedY = newRotatedBottomLeft[1] - rotatedBottomLeft[1];

      const newWidth = proposedWidth;
      const newHeight = proposedHeight;
      const newX = unrotatedBottomLeft[0] - adjustedX;
      const newY = unrotatedBottomLeft[1] - newHeight - adjustedY;

      setBlockMap((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        },
      }));
    } else if (corner === "bottom-left") {
      const activeCorner = [canvasPoint.x, canvasPoint.y];
      const unrotatedActiveCorner = rotateAroundCenter(
        activeCorner[0],
        activeCorner[1],
        cx,
        cy,
        -rotation,
      );

      let proposedWidth = unrotatedTopRight[0] - unrotatedActiveCorner[0];
      let proposedHeight = unrotatedActiveCorner[1] - unrotatedTopRight[1];

      if (preserveAspectRatio) {
        const aspectRatio = block.width / block.height;
        const newAspectRatio = Math.abs(proposedWidth / proposedHeight);
        if (newAspectRatio < aspectRatio) {
          proposedHeight = proposedWidth / aspectRatio;
        } else {
          proposedWidth = proposedHeight * aspectRatio;
        }
      }

      const newCenterX = unrotatedTopRight[0] - proposedWidth / 2;
      const newCenterY = unrotatedTopRight[1] + proposedHeight / 2;

      const newRotatedTopRight = rotateAroundCenter(
        block.x + block.width,
        block.y,
        newCenterX,
        newCenterY,
        rotation,
      );

      const adjustedX = newRotatedTopRight[0] - rotatedTopRight[0];
      const adjustedY = newRotatedTopRight[1] - rotatedTopRight[1];

      const newWidth = proposedWidth;
      const newHeight = proposedHeight;
      const newX = unrotatedTopRight[0] - newWidth - adjustedX;
      const newY = unrotatedTopRight[1] - adjustedY;

      setBlockMap((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        },
      }));
    }
  });

  return (
    <>
      {[...corners].map((corner) => {
        return (
          <div
            {...dragBind()}
            data-corner={corner}
            className="absolute touch-none pointer-events-auto"
            style={{
              left:
                corner === "top-left" || corner === "bottom-left"
                  ? -size / 2
                  : block.width - size / 2,
              top:
                corner === "top-left" || corner === "top-right"
                  ? -size / 2
                  : block.height - size / 2,
              width: size,
              height: size,
            }}
          />
        );
      })}
    </>
  );
}
