import { useAtom } from "jotai";
import { DragEventType, BlockType } from "../types";
import {
  BlockMapAtom,
  CameraAtom,
  CropTempAtom,
  SelectedBlockIdsAtom,
  StateRefAtom,
} from "../atoms";
import { screenToCanvas } from "../Camera";
import { confineCrop } from "../utils";

const dragStateRef = {
  startCanvasPoint: { x: 0, y: 0 },
  currentCanvasPoint: { x: 0, y: 0 },
  initialBlock: {} as BlockType,
  cropTemp: { x: 0, y: 0, width: 0, height: 0 },
  undoState: {} as any,
  redoState: {} as any,
};

export function useHandleBlockCropDrag() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [, setCropTemp] = useAtom(CropTempAtom);

  return function handleBlockCropDrag(dragEvent: DragEventType) {
    const id = dragEvent.targetEl
      .getAttribute("data-target")!
      .replace("block-", "");
    const block = stateRef.blockMap[id];

    if (dragEvent.type === "first") {
      if (!stateRef.selectedBlockIds.includes(id)) {
        stateRef.selectedBlockIds = [id];
        setSelectedBlockIds([id]);
      }
      const canvasPoint = screenToCanvas(
        { x: dragEvent.event.clientX, y: dragEvent.event.clientY },
        stateRef.camera,
        stateRef.zoomContainer!,
      );
      dragStateRef.startCanvasPoint = canvasPoint;
      dragStateRef.initialBlock = { ...block };
    }

    const canvasPoint = screenToCanvas(
      { x: dragEvent.event.clientX, y: dragEvent.event.clientY },
      stateRef.camera,
      stateRef.zoomContainer!,
    );
    dragStateRef.currentCanvasPoint = canvasPoint;

    if (dragStateRef.initialBlock.crop) {
      // move crop box
      const scale = dragStateRef.initialBlock.width / block.crop!.width;
      const canvasDx = canvasPoint.x - dragStateRef.startCanvasPoint.x;
      const canvasDy = canvasPoint.y - dragStateRef.startCanvasPoint.y;
      const newCrop = {
        x: dragStateRef.initialBlock.crop.x - canvasDx / scale,
        y: dragStateRef.initialBlock.crop.y - canvasDy / scale,
        width: block.crop!.width,
        height: block.crop!.height,
      };
      const confinedCrop = confineCrop(newCrop, {
        width: block.originalMediaSize!.width,
        height: block.originalMediaSize!.height,
      });

      setBlockMap((prev) => {
        return {
          ...prev,
          [id]: {
            ...prev[id],
            crop: confinedCrop,
          },
        };
      });
    } else {
      const minX = Math.max(
        Math.min(
          dragStateRef.startCanvasPoint.x,
          dragStateRef.currentCanvasPoint.x,
        ),
        block.x,
      );
      const minY = Math.max(
        Math.min(
          dragStateRef.startCanvasPoint.y,
          dragStateRef.currentCanvasPoint.y,
        ),
        block.y,
      );
      const maxX = Math.min(
        Math.max(
          dragStateRef.startCanvasPoint.x,
          dragStateRef.currentCanvasPoint.x,
        ),
        block.x + block.width,
      );
      const maxY = Math.min(
        Math.max(
          dragStateRef.startCanvasPoint.y,
          dragStateRef.currentCanvasPoint.y,
        ),
        block.y + block.height,
      );
      const width = Math.max(0, maxX - minX);
      const height = Math.max(0, maxY - minY);
      dragStateRef.cropTemp = {
        x: minX,
        y: minY,
        width: width,
        height: height,
      };
      setCropTemp(dragStateRef.cropTemp);
      if (dragEvent.type === "last") {
        console.log(block);
        const x =
          ((dragStateRef.cropTemp.x - block.x) / block.width) *
          block.originalMediaSize!.width;
        const y =
          ((dragStateRef.cropTemp.y - block.y) / block.height) *
          block.originalMediaSize!.height;
        const width =
          (dragStateRef.cropTemp.width / block.width) *
          block.originalMediaSize!.width;
        const height =
          (dragStateRef.cropTemp.height / block.height) *
          block.originalMediaSize!.height;
        setBlockMap((prev) => {
          return {
            ...prev,
            [id]: {
              ...prev[id],
              x: dragStateRef.cropTemp.x,
              y: dragStateRef.cropTemp.y,
              width: dragStateRef.cropTemp.width,
              height: dragStateRef.cropTemp.height,
              crop: {
                x,
                y,
                width,
                height,
              },
            },
          };
        });
        setCropTemp(null);
      }
    }
  };
}

export function CropTemp() {
  const [cropTemp] = useAtom(CropTempAtom);
  const [camera] = useAtom(CameraAtom);
  const borderWidth = Math.max(2 / camera.z, 2);

  return cropTemp ? (
    <div
      className="absolute border-cyan-500"
      style={{
        left: cropTemp.x,
        top: cropTemp.y,
        width: cropTemp.width,
        height: cropTemp.height,
        borderWidth: `${borderWidth}px`,
      }}
    />
  ) : null;
}
