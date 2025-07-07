import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  StateRefAtom,
  ZoomContainerAtom,
} from "./atoms";
import { useHandlePointerEvents } from "./input/useHandlePointerEvents";
import { DragSelectBox } from "./input/useHandleDragSelect";
import { Blocks } from "./Blocks";
import { SelectedBox } from "./SelectedBox";
import { CropTemp } from "./input/useHandleBlockCropDrag";
import { Toolbar } from "./Toolbar";
import { getBoxBoundsFromBlocks } from "./utils";

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
          <BlockBacker />
          <Blocks />
          <CropTemp />
          <DragSelectBox />
          <Toolbar />
        </div>
      </div>
    </div>
  );
}

function BlockBacker() {
  const [blockIds] = useAtom(BlockIdsAtom);
  const [blockMap] = useAtom(BlockMapAtom);
  const allBlocks = blockIds.map((id) => blockMap[id]);
  const allBlockBounds = getBoxBoundsFromBlocks(allBlocks);

  return (
    <div
      className="absolute bg-black left-0 top-0 pointer-events-none"
      style={{
        width: allBlockBounds.width,
        height: allBlockBounds.height,
        transform: `translate(${allBlockBounds.x}px, ${allBlockBounds.y}px)`,
      }}
    ></div>
  );
}
