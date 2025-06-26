import { useAtom } from "jotai";
import { useEffect } from "react";
import {
  BlockSelectorCreatorAtom,
  CameraAtom,
  ZoomContainerAtom,
} from "./atoms";
import { Blocks } from "./Blocks";
import { useHandleDropImage, useHandlePasteImage } from "./hooks";
import { panCamera, zoomCamera } from "./Camera";
import { useDragAndSelect } from "./useDragAndSelect";
import { BlockSelected } from "./BlockSelected";

export function Zoom() {
  const [camera, setCamera] = useAtom(CameraAtom);
  const [zoomContainer, setZoomContainer] = useAtom(ZoomContainerAtom);
  useHandleDropImage();
  useHandlePasteImage();
  const useDragBind = useDragAndSelect();

  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      if (zoomContainer) {
        // if current target is input or textarea, do nothing
        if (
          event.target instanceof HTMLElement &&
          (event.target.tagName === "INPUT" ||
            event.target.tagName === "TEXTAREA")
        ) {
          return;
        }
        event.preventDefault();

        const { clientX: x, clientY: y, deltaX, deltaY, ctrlKey } = event;

        if (ctrlKey) {
          setCamera((camera) =>
            zoomCamera(camera, { x, y }, deltaY / 400, zoomContainer),
          );
        } else {
          setCamera((camera) => panCamera(camera, deltaX, deltaY));
        }
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [zoomContainer, setCamera]);

  return (
    <div
      {...useDragBind()}
      className="absolute inset-0 touch-none"
      ref={(div) => {
        if (div) {
          setZoomContainer(div);
        }
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "100%",
          height: "100%",
          transformOrigin: "0 0",
          transform: `scale(${camera.z}) translate(-50%, -50%) translate(${camera.x}px, ${camera.y}px)`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className="relative pointer-events-none">
          <Blocks />
          <BlockSelectorCreator />
          <BlockSelected />
        </div>
      </div>
    </div>
  );
}

function BlockSelectorCreator() {
  const [camera] = useAtom(CameraAtom);
  const [blockSelectorCreator] = useAtom(BlockSelectorCreatorAtom);

  return blockSelectorCreator ? (
    <div
      className="absolute pointer-events-none border-[2px] border-blue-500"
      style={{
        left: blockSelectorCreator.x,
        top: blockSelectorCreator.y,
        width: blockSelectorCreator.width,
        height: blockSelectorCreator.height,
        borderWidth: Math.max(2, 2 / camera.z),
      }}
    />
  ) : null;
}
