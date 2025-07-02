import { useAtom } from "jotai";
import { CameraAtom, StateRefAtom, ZoomContainerAtom } from "./atoms";
import { useHandlePointerEvents } from "./input/useHandlePointerEvents";
import { DragSelectBox } from "./input/useHandleDragSelect";
import { Blocks } from "./Blocks";
import { SelectedBox } from "./SelectedBox";
import { CropTemp } from "./input/useHandleBlockCropDrag";

export function Zoom() {
  const [camera] = useAtom(CameraAtom);
  const [stateRef] = useAtom(StateRefAtom);
  const [, setZoomContainer] = useAtom(ZoomContainerAtom);
  const pointerEventsBind = useHandlePointerEvents();

  return (
    <div
      {...pointerEventsBind}
      className="absolute inset-0 active touch-none cursor-crosshair"
      data-target="zoom-container"
      ref={(div) => {
        if (div) {
          stateRef.zoomContainer = div;
          setZoomContainer(div);
        }
      }}
    >
      <div
        className="pointer-events-none"
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
        <div className="relative">
          <Blocks />
          <CropTemp />
          <DragSelectBox />
        </div>
      </div>
    </div>
  );
}
